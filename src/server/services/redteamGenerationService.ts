import { v4 as uuidv4 } from 'uuid';
import { createHash } from 'crypto';
import { eq } from 'drizzle-orm';
import { getDb } from '../../database';
import { datasetsTable } from '../../database/tables';
import { synthesize } from '../../redteam';
import type { SynthesizeOptions } from '../../redteam/types';
import { supabase } from '../middleware/auth';
import logger from '../../logger';

export interface GenerationResult {
  jobId: string;
  datasetId: string;
  testCount: number;
  status: 'generating' | 'completed' | 'error';
  error?: string;
}

export interface DatasetMetadata {
  test_count: number;
  plugins: string[];
  strategies: string[];
  generated_at: number;
  original_config: any;
  purpose?: string;
  entities?: string[];
  injectVar?: string;
}

export class RedteamGenerationService {
  private readonly db = getDb();

  /**
   * Generate a test dataset for a user without executing it
   */
  async generateTestDataset(
    userId: string,
    config: any, // UnifiedConfig from frontend
    abortSignal?: AbortSignal
  ): Promise<GenerationResult> {
    const jobId = uuidv4();
    
    try {
      logger.info(`Starting test generation job ${jobId} for user ${userId}`);
      logger.debug(`Config received: ${JSON.stringify(config, null, 2)}`);
      
      // Extract redteam config from UnifiedConfig
      const redteamConfig = config.redteam || {};
      const targets = config.targets || [];
      const prompts = config.prompts || [];
      
      // Convert UnifiedConfig to SynthesizeOptions format
      const synthesizeConfig: SynthesizeOptions = {
        plugins: (redteamConfig.plugins || []).map((plugin: any) => ({
          id: typeof plugin === 'string' ? plugin : plugin.id,
          numTests: redteamConfig.numTests,
          ...(typeof plugin === 'object' && plugin.config && { config: plugin.config }),
          ...(typeof plugin === 'object' && plugin.severity && { severity: plugin.severity }),
        })),
        strategies: (redteamConfig.strategies || []).map((strategy: any) => 
          typeof strategy === 'string' ? { id: strategy } : strategy
        ),
        purpose: redteamConfig.purpose || '',
        numTests: redteamConfig.numTests,
        language: redteamConfig.language || 'en',
        prompts: Array.isArray(prompts) && prompts.length > 0 ? prompts as [string, ...string[]] : ['default'],
        targetLabels: targets.map((target: any) => target.label || target.id || 'target'),
        entities: redteamConfig.entities,
        injectVar: redteamConfig.injectVar,
        testGenerationInstructions: redteamConfig.testGenerationInstructions,
        abortSignal,
      };
      
      logger.debug(`Synthesize config: ${JSON.stringify(synthesizeConfig, null, 2)}`);
      
      // Use existing synthesize logic - NO CHANGES to core
      const { testCases, purpose, entities, injectVar } = await synthesize(synthesizeConfig);
      
      // Generate deterministic dataset ID using existing logic
      const datasetId = this.generateDatasetId(testCases);
      
      // Check if dataset already exists in promptfoo core
      const existingDataset = await this.db
        .select()
        .from(datasetsTable)
        .where(eq(datasetsTable.id, datasetId))
        .limit(1);
      
      // Store in existing datasetsTable - NO CHANGES to schema
      if (existingDataset.length === 0) {
        await this.db.insert(datasetsTable).values({
          id: datasetId,
          tests: testCases,
        });
        logger.debug(`Created new dataset ${datasetId} with ${testCases.length} test cases`);
      } else {
        logger.debug(`Dataset ${datasetId} already exists, using existing`);
      }
      
      // Map to user in Supabase ONLY
      const metadata: DatasetMetadata = {
        test_count: testCases.length,
        plugins: (redteamConfig.plugins || []).map((p: any) => typeof p === 'string' ? p : p.id),
        strategies: (redteamConfig.strategies || []).map((s: any) => typeof s === 'string' ? s : s.id),
        generated_at: Date.now(),
        original_config: config,
        purpose,
        entities,
        injectVar,
      };
      
      // Insert user-dataset mapping
      const { error: supabaseError } = await supabase
        .from('user_datasets')
        .insert({
          user_id: userId,
          dataset_id: datasetId,
          metadata,
        });
      
      if (supabaseError) {
        // Check if it's a unique constraint violation (dataset already mapped to user)
        if (supabaseError.code === '23505') {
          logger.debug(`Dataset ${datasetId} already mapped to user ${userId}`);
        } else {
          throw new Error(`Failed to map dataset to user: ${supabaseError.message}`);
        }
      }
      
      logger.info(`Successfully generated dataset ${datasetId} with ${testCases.length} test cases`);
      
      return {
        jobId,
        datasetId,
        testCount: testCases.length,
        status: 'completed'
      };
      
    } catch (error) {
      logger.error(`Test generation failed for job ${jobId}: ${error}`);
      
      return {
        jobId,
        datasetId: '',
        testCount: 0,
        status: 'error',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
  
  /**
   * Get user's generated datasets
   */
  async getUserDatasets(userId: string): Promise<Array<{
    dataset_id: string;
    test_count: number;
    created_at: string;
    plugins: string[];
    strategies: string[];
    purpose?: string;
  }>> {
    const { data, error } = await supabase
      .from('user_datasets')
      .select(`
        dataset_id,
        metadata,
        created_at
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      throw new Error(`Failed to fetch user datasets: ${error.message}`);
    }
    
    return data.map(row => ({
      dataset_id: row.dataset_id,
      test_count: row.metadata?.test_count || 0,
      created_at: row.created_at,
      plugins: row.metadata?.plugins || [],
      strategies: row.metadata?.strategies || [],
      purpose: row.metadata?.purpose,
    }));
  }
  
  /**
   * Get dataset details for a user
   */
  async getDatasetDetails(userId: string, datasetId: string): Promise<{
    dataset_id: string;
    tests: any[];
    test_count: number;
    metadata: DatasetMetadata;
    created_at: string;
  } | null> {
    // Check if user owns this dataset
    const { data: userDataset, error: userError } = await supabase
      .from('user_datasets')
      .select('metadata, created_at')
      .eq('user_id', userId)
      .eq('dataset_id', datasetId)
      .single();
    
    if (userError || !userDataset) {
      return null; // User doesn't own this dataset
    }
    
    // Get the actual test cases from promptfoo core
    const dataset = await this.db
      .select()
      .from(datasetsTable)
      .where(eq(datasetsTable.id, datasetId))
      .limit(1);
    
    if (dataset.length === 0) {
      return null; // Dataset not found
    }
    
    return {
      dataset_id: datasetId,
      tests: Array.isArray(dataset[0].tests) ? dataset[0].tests : [],
      test_count: userDataset.metadata?.test_count || 0,
      metadata: userDataset.metadata,
      created_at: userDataset.created_at,
    };
  }
  
  /**
   * Generate deterministic dataset ID using SHA256 hash
   * This matches the existing promptfoo logic for dataset deduplication
   */
  private generateDatasetId(testCases: any[]): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(testCases));
    return hash.digest('hex');
  }
}

// Export singleton instance
export const redteamGenerationService = new RedteamGenerationService();