import { Router } from 'express';
import type { Request, Response } from 'express';
import logger from '../../logger';
import { getRemoteGenerationUrl } from '../../redteam/remoteGeneration';
import { authenticateSupabaseUser, supabase, type AuthenticatedRequest } from '../middleware/auth';
import { userJobManager } from '../services/userJobManager';

export const redteamRouter = Router();

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
    const { evalsTable } = await import('../../database/tables');
    const { eq, desc } = await import('drizzle-orm');
    
    const db = getDb();
    
    // Get user's evaluations using the author field
    const results = await db.select()
      .from(evalsTable)
      .where(eq(evalsTable.author, req.user.email || ''))
      .orderBy(desc(evalsTable.createdAt))
      .limit(50); // Limit to recent results
    
    res.json({ results });
  } catch (error) {
    logger.error(`Error fetching user results: ${error}`);
    res.status(500).json({ error: 'Failed to fetch results' });
  }
});
