import { eq, and } from 'drizzle-orm';
import { Router } from 'express';
import type { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../../database';
import { configsTable } from '../../database/tables';
import logger from '../../logger';
import { templates, type TemplateTier } from '../templates/redteamTemplates';

export const configsRouter = Router();

configsRouter.get('/', async (req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const type = req.query.type as string;
    const query = db
      .select({
        id: configsTable.id,
        name: configsTable.name,
        createdAt: configsTable.createdAt,
        updatedAt: configsTable.updatedAt,
        type: configsTable.type,
      })
      .from(configsTable)
      .orderBy(configsTable.updatedAt);

    if (type) {
      query.where(eq(configsTable.type, type));
    }

    const configs = await query;
    logger.info(`Loaded ${configs.length} configs${type ? ` of type ${type}` : ''}`);

    res.json({ configs });
  } catch (error) {
    logger.error(`Error fetching configs: ${error}`);
    res.status(500).json({ error: 'Failed to fetch configs' });
  }
});

configsRouter.post('/', async (req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const { name, type, config } = req.body;
    const id = uuidv4();

    const [result] = await db
      .insert(configsTable)
      .values({
        id,
        name,
        type,
        config,
      })
      .returning({
        id: configsTable.id,
        createdAt: configsTable.createdAt,
      });

    logger.info(`Saved config ${id} of type ${type}`);

    res.json(result);
  } catch (error) {
    logger.error(`Error saving config: ${error}`);
    res.status(500).json({ error: 'Failed to save config' });
  }
});

configsRouter.get('/:type', async (req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const configs = await db
      .select({
        id: configsTable.id,
        name: configsTable.name,
        createdAt: configsTable.createdAt,
        updatedAt: configsTable.updatedAt,
      })
      .from(configsTable)
      .where(eq(configsTable.type, req.params.type))
      .orderBy(configsTable.updatedAt);

    logger.info(`Loaded ${configs.length} configs of type ${req.params.type}`);

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

configsRouter.get('/:type/:id', async (req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const config = await db
      .select()
      .from(configsTable)
      .where(and(eq(configsTable.type, req.params.type), eq(configsTable.id, req.params.id)))
      .limit(1);

    logger.info(`Loaded config ${req.params.id} of type ${req.params.type}`);

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

configsRouter.delete('/:type/:id', async (req: Request, res: Response): Promise<void> => {
  const db = await getDb();
  try {
    const result = await db
      .delete(configsTable)
      .where(and(eq(configsTable.type, req.params.type), eq(configsTable.id, req.params.id)))
      .returning({ id: configsTable.id });

    if (result.length === 0) {
      res.status(404).json({ error: 'Config not found' });
      return;
    }

    logger.info(`Deleted config ${req.params.id} of type ${req.params.type}`);
    res.json({ success: true, id: result[0].id });
  } catch (error) {
    logger.error(`Error deleting config: ${error}`);
    res.status(500).json({ error: 'Failed to delete config' });
  }
});
