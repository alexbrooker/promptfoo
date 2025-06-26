import { Router } from 'express';
import type { Request, Response } from 'express';
import logger from '../../logger';
import { getRemoteGenerationUrl } from '../../redteam/remoteGeneration';
import { authenticateSupabaseUser, supabase, type AuthenticatedRequest } from '../middleware/auth';
import { userJobManager } from '../services/userJobManager';
import { redteamGenerationService } from '../services/redteamGenerationService';

export const redteamRouter = Router();

// Generate test dataset only (new endpoint for phase separation)
redteamRouter.post('/generate', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { config } = req.body;
  
  try {
    logger.debug(`Received generate request for user ${req.user.id}: ${JSON.stringify(config, null, 2)}`);
    
    // TODO: Add credit consumption for generation phase
    const result = await redteamGenerationService.generateTestDataset(req.user.id, config);
    
    if (result.status === 'error') {
      res.status(500).json({ 
        error: 'Test generation failed',
        message: result.error 
      });
      return;
    }
    
    res.json({
      jobId: result.jobId,
      datasetId: result.datasetId,
      testCount: result.testCount,
      status: result.status
    });
    
  } catch (error) {
    logger.error(`Test generation failed: ${error}`);
    res.status(500).json({ error: 'Test generation failed' });
  }
});

// List user's generated datasets
redteamRouter.get('/datasets', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    const datasets = await redteamGenerationService.getUserDatasets(req.user.id);
    res.json({ datasets });
  } catch (error) {
    logger.error(`Failed to fetch user datasets: ${error}`);
    res.status(500).json({ error: 'Failed to fetch datasets' });
  }
});

// Get dataset details
redteamRouter.get('/datasets/:datasetId', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { datasetId } = req.params;
  
  try {
    const dataset = await redteamGenerationService.getDatasetDetails(req.user.id, datasetId);
    
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found or access denied' });
      return;
    }
    
    res.json(dataset);
  } catch (error) {
    logger.error(`Failed to fetch dataset details: ${error}`);
    res.status(500).json({ error: 'Failed to fetch dataset details' });
  }
});

// Execute existing dataset
redteamRouter.post('/execute', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  // Check scan credits before proceeding
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('scan_credits, credits_used')
    .eq('id', req.user.id)
    .single();

  if (profileError) {
    logger.error(`Error fetching user profile: ${profileError.message}`);
    res.status(500).json({ error: 'Failed to fetch user profile' });
    return;
  }

  const scanCredits = profile?.scan_credits || 0;
  if (scanCredits <= 0) {
    res.status(402).json({ 
      error: 'Insufficient scan credits', 
      message: 'You need to purchase scan credits to execute a security scan.',
      scanCredits,
    });
    return;
  }

  const { datasetId, providers, target, useOriginalTarget } = req.body;
  
  try {
    // Verify user owns this dataset
    const dataset = await redteamGenerationService.getDatasetDetails(req.user.id, datasetId);
    if (!dataset) {
      res.status(404).json({ error: 'Dataset not found or access denied' });
      return;
    }
    
    // Consume the scan credit for execution phase
    const { error: creditError } = await supabase
      .from('profiles')
      .update({
        scan_credits: scanCredits - 1,
        credits_used: (profile?.credits_used || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq('id', req.user.id);

    if (creditError) {
      logger.error(`Error consuming scan credit: ${creditError.message}`);
      res.status(500).json({ error: 'Failed to consume scan credit' });
      return;
    }

    // Create execution config using existing dataset
    let executionConfig;
    
    if (useOriginalTarget && target) {
      // Use the provided target configuration (from original config)
      executionConfig = {
        ...dataset.metadata.original_config,
        target: target,
        // Use pre-generated tests from dataset
        tests: dataset.tests,
      };
    } else if (providers) {
      // Use provider-based configuration (legacy mode)
      executionConfig = {
        ...dataset.metadata.original_config,
        providers: providers,
        // Use pre-generated tests from dataset
        tests: dataset.tests,
      };
    } else {
      // Fallback to original target if available
      executionConfig = {
        ...dataset.metadata.original_config,
        // Use pre-generated tests from dataset
        tests: dataset.tests,
      };
    }
    
    // Enqueue execution job
    const jobId = await userJobManager.enqueueJob(req.user.id, req.user.email || '', executionConfig);

    // Log credit consumption
    await supabase.from('usage_logs').insert({
      user_id: req.user.id,
      action: 'scan_credit_consumed',
      metadata: {
        scan_id: jobId,
        dataset_id: datasetId,
        phase: 'execution',
        credits_remaining: scanCredits - 1,
        credits_consumed: 1,
      }
    });

    logger.info(`Consumed scan credit for dataset execution by user ${req.user.id}, remaining credits: ${scanCredits - 1}`);

    const queuePosition = userJobManager.getQueuePosition(req.user.id, jobId);
    
    res.json({ 
      jobId,
      datasetId,
      status: 'queued',
      queuePosition,
      message: queuePosition === 1 ? 'Starting execution...' : `Queued (position ${queuePosition})`,
    });
    
  } catch (error) {
    logger.error(`Dataset execution failed: ${error}`);
    res.status(500).json({ error: 'Dataset execution failed' });
  }
});

redteamRouter.post('/run', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  // Check scan credits before proceeding
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('scan_credits, credits_used')
    .eq('id', req.user.id)
    .single();

  if (profileError) {
    logger.error(`Error fetching user profile: ${profileError.message}`);
    res.status(500).json({ error: 'Failed to fetch user profile' });
    return;
  }

  const scanCredits = profile?.scan_credits || 0;
  if (scanCredits <= 0) {
    res.status(402).json({ 
      error: 'Insufficient scan credits', 
      message: 'You need to purchase scan credits to run a security scan.',
      scanCredits,
    });
    return;
  }

  // Consume the scan credit immediately (to prevent gaming)
  const { error: creditError } = await supabase
    .from('profiles')
    .update({
      scan_credits: scanCredits - 1,
      credits_used: (profile?.credits_used || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq('id', req.user.id);

  if (creditError) {
    logger.error(`Error consuming scan credit: ${creditError.message}`);
    res.status(500).json({ error: 'Failed to consume scan credit' });
    return;
  }

  const { config } = req.body;
  
  // Enqueue the job instead of running immediately
  const jobId = await userJobManager.enqueueJob(req.user.id, req.user.email || '', config);

  // Log credit consumption
  await supabase.from('usage_logs').insert({
    user_id: req.user.id,
    action: 'scan_credit_consumed',
    metadata: {
      scan_id: jobId,
      credits_remaining: scanCredits - 1,
      credits_consumed: 1,
    }
  });

  logger.info(`Consumed scan credit for user ${req.user.id}, remaining credits: ${scanCredits - 1}`);

  const queuePosition = userJobManager.getQueuePosition(req.user.id, jobId);
  
  res.json({ 
    id: jobId,
    status: 'queued',
    queuePosition,
    message: queuePosition === 1 ? 'Starting scan...' : `Queued (position ${queuePosition})`,
  });
});

redteamRouter.post('/cancel/:jobId', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { jobId } = req.params;
  const cancelled = await userJobManager.cancelJob(req.user.id, jobId);

  if (cancelled) {
    res.json({ message: 'Job cancelled successfully' });
  } else {
    res.status(400).json({ error: 'Job not found or cannot be cancelled' });
  }
});

// NOTE: This comes last, so the other routes take precedence
redteamRouter.post('/:task', async (req: Request, res: Response): Promise<void> => {
  const { task } = req.params;
  const cloudFunctionUrl = getRemoteGenerationUrl();
  logger.debug(
    `Received ${task} task request: ${JSON.stringify({
      method: req.method,
      url: req.url,
      body: req.body,
    })}`,
  );

  try {
    logger.debug(`Sending request to cloud function: ${cloudFunctionUrl}`);
    const response = await fetch(cloudFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        task,
        ...req.body,
      }),
    });

    if (!response.ok) {
      logger.error(`Cloud function responded with status ${response.status}`);
      throw new Error(`Cloud function responded with status ${response.status}`);
    }

    const data = await response.json();
    logger.debug(`Received response from cloud function: ${JSON.stringify(data)}`);
    res.json(data);
  } catch (error) {
    logger.error(`Error in ${task} task: ${error}`);
    res.status(500).json({ error: `Failed to process ${task} task` });
  }
});

redteamRouter.get('/status/:jobId', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const { jobId } = req.params;
  const job = userJobManager.getUserJob(req.user.id, jobId);

  if (!job) {
    res.status(404).json({ error: 'Job not found' });
    return;
  }

  const queuePosition = userJobManager.getQueuePosition(req.user.id, jobId);

  res.json({
    id: job.id,
    status: job.status,
    progress: job.progress,
    total: job.total,
    result: job.result,
    logs: job.logs,
    queuePosition,
    queuedAt: job.queuedAt,
    startTime: job.startTime,
  });
});

redteamRouter.get('/jobs', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  const jobs = userJobManager.getUserJobs(req.user.id);
  res.json({ jobs });
});

redteamRouter.get('/queue/status', async (req: Request, res: Response): Promise<void> => {
  const queueStatus = userJobManager.getQueueStatus();
  res.json(queueStatus);
});

redteamRouter.get('/results', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  if (!req.user) {
    res.status(401).json({ error: 'User not authenticated' });
    return;
  }

  try {
    const { getDb } = await import('../../database');
    const { evalsTable, evalsToDatasetsTable } = await import('../../database/tables');
    const { eq, desc, sql } = await import('drizzle-orm');
    
    const db = getDb();
    const userEmail = req.user.email || '';
    
    // Use the same query structure as getEvalSummaries but filter by user email
    const dbResults = db
      .select({
        evalId: evalsTable.id,
        createdAt: evalsTable.createdAt,
        description: evalsTable.description,
        datasetId: evalsToDatasetsTable.datasetId,
        isRedteam: sql<boolean>`json_type(${evalsTable.config}, '$.redteam') IS NOT NULL`,
        prompts: evalsTable.prompts,
      })
      .from(evalsTable)
      .leftJoin(evalsToDatasetsTable, eq(evalsTable.id, evalsToDatasetsTable.evalId))
      .where(eq(evalsTable.author, userEmail))
      .orderBy(desc(evalsTable.createdAt))
      .limit(50)
      .all();

    // Transform using the same logic as getEvalSummaries
    const results = dbResults.map((result) => {
      const passCount =
        result.prompts?.reduce((memo, prompt) => {
          return memo + (prompt.metrics?.testPassCount ?? 0);
        }, 0) ?? 0;

      const testCounts = result.prompts?.map((p) => {
        return (
          (p.metrics?.testPassCount ?? 0) +
          (p.metrics?.testFailCount ?? 0) +
          (p.metrics?.testErrorCount ?? 0)
        );
      }) ?? [0];

      const testCount = testCounts.length > 0 ? testCounts[0] : 0;
      const testRunCount = testCount * (result.prompts?.length ?? 0);

      return {
        evalId: result.evalId,
        createdAt: result.createdAt,
        description: result.description,
        numTests: testCount,
        datasetId: result.datasetId,
        isRedteam: result.isRedteam,
        passRate: testRunCount > 0 ? (passCount / testRunCount) * 100 : 0,
        label: result.description ? `${result.description} (${result.evalId})` : result.evalId,
      };
    });
    
    res.json({ results });
  } catch (error) {
    logger.error(`Error fetching user results: ${error}`);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});
