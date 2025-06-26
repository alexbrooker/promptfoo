import { eq, and, inArray } from 'drizzle-orm';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../database';
import { configsTable } from '../../database/tables';
import logger from '../../logger';
import { templates, type TemplateTier } from '../templates/redteamTemplates';
import { authenticateSupabaseUser, supabase, type AuthenticatedRequest } from '../middleware/auth';

export const configsRouter = Router();

configsRouter.get('/', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const type = req.query.type as string || 'redteam';
    
    // Get user's config IDs from Supabase mapping table
    const { data: userConfigMappings, error: mappingError } = await supabase
      .from('user_configs')
      .select('config_id')
      .eq('user_id', req.user!.id)
      .eq('config_type', type);
    
    if (mappingError) {
      logger.error(`Error fetching user config mappings: ${mappingError.message}`);
      res.status(500).json({ error: 'Failed to fetch user configs' });
      return;
    }
    
    const userConfigIds = userConfigMappings?.map(mapping => mapping.config_id) || [];
    
    // If user has no configs, return empty array
    if (userConfigIds.length === 0) {
      res.json({ configs: [] });
      return;
    }
    
    // Query promptfoo configs table filtered by user's config IDs
    const configs = await db
      .select({
        id: configsTable.id,
        name: configsTable.name,
        createdAt: configsTable.createdAt,
        updatedAt: configsTable.updatedAt,
        type: configsTable.type,
        config: configsTable.config,
      })
      .from(configsTable)
      .where(
        and(
          eq(configsTable.type, type),
          inArray(configsTable.id, userConfigIds)
        )
      )
      .orderBy(configsTable.updatedAt);

    logger.info(`Loaded ${configs.length} configs of type ${type} for user ${req.user!.email}`);

    res.json({ configs });
  } catch (error) {
    logger.error(`Error fetching configs: ${error}`);
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

configsRouter.post('/', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const { name, type, config } = req.body;
    const configId = uuidv4();

    // Create config in promptfoo database
    const [result] = await db
      .insert(configsTable)
      .values({
        id: configId,
        name,
        type: type || 'redteam',
        config,
      })
      .returning({
        id: configsTable.id,
        createdAt: configsTable.createdAt,
      });

    // Create user mapping in Supabase
    const { error: mappingError } = await supabase
      .from('user_configs')
      .insert({
        user_id: req.user!.id,
        config_id: configId,
        config_type: type || 'redteam',
        config_name: name
      });
    
    if (mappingError) {
      // If mapping fails, clean up the config
      await db.delete(configsTable).where(eq(configsTable.id, configId));
      logger.error(`Error creating user config mapping: ${mappingError.message}`);
      res.status(500).json({ error: 'Failed to create config mapping' });
      return;
    }

    logger.info(`Saved config ${configId} of type ${type || 'redteam'} for user ${req.user!.email}`);

    res.json(result);
  } catch (error) {
    logger.error(`Error saving config: ${error}`);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

configsRouter.get('/:type', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const type = req.params.type;
    
    // Get user's config IDs from Supabase mapping table
    const { data: userConfigMappings, error: mappingError } = await supabase
      .from('user_configs')
      .select('config_id')
      .eq('user_id', req.user!.id)
      .eq('config_type', type);
    
    if (mappingError) {
      logger.error(`Error fetching user config mappings: ${mappingError.message}`);
      res.status(500).json({ error: 'Failed to fetch user configs' });
      return;
    }
    
    const userConfigIds = userConfigMappings?.map(mapping => mapping.config_id) || [];
    
    // If user has no configs, return empty array
    if (userConfigIds.length === 0) {
      res.json({ configs: [] });
      return;
    }
    
    // Query promptfoo configs table filtered by user's config IDs
    const configs = await db
      .select({
        id: configsTable.id,
        name: configsTable.name,
        createdAt: configsTable.createdAt,
        updatedAt: configsTable.updatedAt,
        config: configsTable.config,
      })
      .from(configsTable)
      .where(
        and(
          eq(configsTable.type, type),
          inArray(configsTable.id, userConfigIds)
        )
      )
      .orderBy(configsTable.updatedAt);

    logger.info(`Loaded ${configs.length} configs of type ${type} for user ${req.user!.email}`);

    res.json({ configs });
  } catch (error) {
    logger.error(`Error fetching configs: ${error}`);
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

// Get redteam template by tier
configsRouter.get('/templates/:tier', async (req: Request, res: Response): Promise<void> => {
  try {
    const tier = req.params.tier as TemplateTier;

    if (!templates[tier]) {
      res.status(404).json({ error: `Template not found for tier: ${tier}` });
      return;
    }

    const template = templates[tier];
    logger.info(`Loaded redteam template for tier: ${tier}`);

    // Return in same format as regular config load
    res.json({
      id: `template-${tier}`,
      name: `${tier === 'quick' ? 'Quick Check' : 'Business Scan'} Template`,
      type: 'redteam',
      config: template,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
  } catch (error) {
    logger.error(`Error fetching template: ${error}`);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

configsRouter.get('/:type/:id', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const { type, id } = req.params;
    
    // First check if user owns this config
    const { data: userConfigMapping, error: mappingError } = await supabase
      .from('user_configs')
      .select('config_id')
      .eq('user_id', req.user!.id)
      .eq('config_id', id)
      .eq('config_type', type)
      .single();
    
    if (mappingError || !userConfigMapping) {
      res.status(404).json({ error: 'Config not found or access denied' });
      return;
    }
    
    // User owns the config, fetch it from promptfoo database
    const config = await db
      .select()
      .from(configsTable)
      .where(and(eq(configsTable.type, type), eq(configsTable.id, id)))
      .limit(1);

    logger.info(`Loaded config ${id} of type ${type} for user ${req.user!.email}`);

    if (!config.length) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }

    res.json(config[0]);
  } catch (error) {
    logger.error(`Error fetching config: ${error}`);
    res.status(500).json({ error: 'Failed to fetch config' });
  }
});

configsRouter.put('/:type/:id', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const { type, id } = req.params;
    const { name, config } = req.body;
    
    // First check if user owns this config
    const { data: userConfigMapping, error: mappingError } = await supabase
      .from('user_configs')
      .select('config_id')
      .eq('user_id', req.user!.id)
      .eq('config_id', id)
      .eq('config_type', type)
      .single();
    
    if (mappingError || !userConfigMapping) {
      res.status(404).json({ error: 'Config not found or access denied' });
      return;
    }
    
    // Update config in promptfoo database
    const [result] = await db
      .update(configsTable)
      .set({
        name,
        config,
        updatedAt: Math.floor(Date.now() / 1000),
      })
      .where(and(eq(configsTable.type, type), eq(configsTable.id, id)))
      .returning({
        id: configsTable.id,
        updatedAt: configsTable.updatedAt,
      });

    if (!result) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }
    
    // Update the user mapping in Supabase
    const { error: updateMappingError } = await supabase
      .from('user_configs')
      .update({
        config_name: name,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', req.user!.id)
      .eq('config_id', id);
    
    if (updateMappingError) {
      logger.warn(`Failed to update user config mapping: ${updateMappingError.message}`);
      // Continue anyway since the config is updated
    }

    logger.info(`Updated config ${id} of type ${type} for user ${req.user!.email}`);
    res.json(result);
  } catch (error) {
    logger.error(`Error updating config: ${error}`);
    res.status(500).json({ error: 'Failed to update config' });
  }
});

configsRouter.delete('/:type/:id', authenticateSupabaseUser, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const { type, id } = req.params;
    
    // First check if user owns this config
    const { data: userConfigMapping, error: mappingError } = await supabase
      .from('user_configs')
      .select('config_id')
      .eq('user_id', req.user!.id)
      .eq('config_id', id)
      .eq('config_type', type)
      .single();
    
    if (mappingError || !userConfigMapping) {
      res.status(404).json({ error: 'Config not found or access denied' });
      return;
    }
    
    // Delete from promptfoo database
    const result = await db
      .delete(configsTable)
      .where(and(eq(configsTable.type, type), eq(configsTable.id, id)))
      .returning({ id: configsTable.id });

    if (result.length === 0) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }
    
    // Delete the user mapping from Supabase
    const { error: deleteMappingError } = await supabase
      .from('user_configs')
      .delete()
      .eq('user_id', req.user!.id)
      .eq('config_id', id);
    
    if (deleteMappingError) {
      logger.warn(`Failed to delete user config mapping: ${deleteMappingError.message}`);
      // Continue anyway since the config is deleted
    }

    logger.info(`Deleted config ${id} of type ${type} for user ${req.user!.email}`);
    res.json({ success: true, id: result[0].id });
  } catch (error) {
    logger.error(`Error deleting config: ${error}`);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});
