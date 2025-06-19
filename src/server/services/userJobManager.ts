import { v4 as uuidv4 } from 'uuid';
import { eq } from 'drizzle-orm';
import { getDb } from '../../database';
import { evalsTable } from '../../database/tables';
import logger from '../../logger';
import { doRedteamRun } from '../../redteam/shared';
import { supabase } from '../middleware/auth';

export interface QueuedJob {
  id: string;
  userId: string;
  userEmail: string;
  config: any;
  status: 'queued' | 'in-progress' | 'complete' | 'error';
  progress: number;
  total: number;
  result: any;
  logs: string[];
  startTime?: number;
  queuedAt: number;
  abortController?: AbortController;
}

class UserJobManager {
  private jobs = new Map<string, QueuedJob>();
  private queue: string[] = [];
  private currentJobId: string | null = null;
  private isProcessing = false;
  private processingLock = false;

  async enqueueJob(userId: string, userEmail: string, config: any): Promise<string> {
    const jobId = uuidv4();
    
    const job: QueuedJob = {
      id: jobId,
      userId,
      userEmail,
      config,
      status: 'queued',
      progress: 0,
      total: 0,
      result: null,
      logs: [],
      queuedAt: Date.now(),
    };

    this.jobs.set(jobId, job);
    this.queue.push(jobId);
    
    logger.info(`Enqueued job ${jobId} for user ${userEmail}. Queue position: ${this.queue.length}`);
    
    // Start processing if not already running
    this.processQueue();
    
    return jobId;
  }

  private async processQueue(): Promise<void> {
    // Prevent race conditions with proper locking
    if (this.processingLock || this.queue.length === 0) {
      return;
    }

    this.processingLock = true;
    this.isProcessing = true;
    
    try {
      while (this.queue.length > 0) {
        const jobId = this.queue.shift()!;
        const job = this.jobs.get(jobId);
        
        if (!job) {
          logger.warn(`Job ${jobId} not found in jobs map, skipping`);
          continue;
        }

        this.currentJobId = jobId;
        job.status = 'in-progress';
        job.startTime = Date.now();
        job.abortController = new AbortController();
        
        logger.info(`Starting job ${jobId} for user ${job.userEmail}`);

        try {
          await this.executeJob(job);
        } catch (error) {
          // Check if this was an abort error
          const isAborted = error instanceof Error && 
            (error.name === 'AbortError' || error.message.includes('abort'));
          
          if (isAborted) {
            logger.info(`Job ${jobId} was aborted by user`);
            // Don't refund for user-cancelled jobs
          } else {
            logger.error(`Job ${jobId} failed: ${error}`);
            job.status = 'error';
            job.logs.push(`Error: ${error instanceof Error ? error.message : String(error)}`);
            
            // Refund credit if scan failed early (within first 30 seconds)
            const runtime = Date.now() - (job.startTime || Date.now());
            const shouldRefund = runtime < 30000;
            
            if (shouldRefund) {
              await this.refundCredit(job);
            }
          }
        }
        
        // Clean up job state
        this.currentJobId = null;
        if (job.abortController) {
          job.abortController = undefined; // Clean up reference
        }
      }
    } finally {
      this.isProcessing = false;
      this.processingLock = false;
    }
  }

  private async executeJob(job: QueuedJob): Promise<void> {
    // Add job ID to config metadata for logging and tracking
    const configWithJobId = {
      ...job.config,
      metadata: {
        ...job.config.metadata,
        jobId: job.id
      }
    };

    const evalResult = await doRedteamRun({
      liveRedteamConfig: configWithJobId,
      force: false,
      verbose: false,
      delay: 0,
      maxConcurrency: 1,
      logCallback: (message: string) => {
        job.logs.push(message);
      },
      progressCallback: (completed: number, total: number) => {
        job.progress = completed;
        job.total = total;
        logger.debug(`Job ${job.id} progress: ${completed}/${total}`);
      },
      abortSignal: job.abortController?.signal,
    });

    if (evalResult) {
      const summary = await evalResult.toEvaluateSummary();
      job.result = summary;
      job.status = 'complete';
      
      // Store the result in database with user association
      await this.storeJobResult(job, evalResult.id, summary);
      
      logger.info(`Job ${job.id} completed successfully for user ${job.userEmail}`);
    } else {
      throw new Error('No evaluation result returned');
    }
  }

  private async storeJobResult(job: QueuedJob, evalId: string | null, summary: any): Promise<void> {
    try {
      const db = getDb();
      
      // Check if eval already exists (it should from doRedteamRun)
      if (evalId) {
        // Update the existing eval with user information
        await db.update(evalsTable)
          .set({ 
            author: job.userEmail  // Use author field for user identification
          })
          .where(eq(evalsTable.id, evalId));
      }
      
      logger.debug(`Stored job result for user ${job.userEmail}, evalId: ${evalId}`);
    } catch (error) {
      logger.error(`Failed to store job result: ${error}`);
      // Don't throw - job completed successfully, storage is secondary
    }
  }

  private async refundCredit(job: QueuedJob): Promise<void> {
    try {
      // Get current credits first
      const { data: profile } = await supabase
        .from('profiles')
        .select('scan_credits, credits_used')
        .eq('id', job.userId)
        .single();

      const { error: refundError } = await supabase
        .from('profiles')
        .update({
          scan_credits: (profile?.scan_credits || 0) + 1,
          credits_used: Math.max((profile?.credits_used || 1) - 1, 0),
          updated_at: new Date().toISOString(),
        })
        .eq('id', job.userId);

      if (refundError === null) {
        // Log credit refund
        await supabase.from('usage_logs').insert({
          user_id: job.userId,
          action: 'scan_credit_refunded',
          metadata: {
            scan_id: job.id,
            reason: 'early_failure',
            runtime_ms: Date.now() - (job.startTime || Date.now()),
            credits_refunded: 1,
          }
        });
        
        logger.info(`Refunded scan credit for user ${job.userEmail} due to early failure`);
        job.logs.push('Scan credit refunded due to early failure');
      } else {
        logger.error(`Failed to refund credit: ${refundError.message}`);
      }
    } catch (refundErr) {
      logger.error(`Error refunding credit: ${refundErr}`);
    }
  }

  getUserJob(userId: string, jobId: string): QueuedJob | undefined {
    const job = this.jobs.get(jobId);
    return job && job.userId === userId ? job : undefined;
  }

  getUserJobs(userId: string): QueuedJob[] {
    return Array.from(this.jobs.values())
      .filter(job => job.userId === userId)
      .sort((a, b) => b.queuedAt - a.queuedAt);
  }

  getQueuePosition(userId: string, jobId: string): number | null {
    const job = this.jobs.get(jobId);
    if (!job || job.userId !== userId || job.status !== 'queued') {
      return null;
    }
    
    return this.queue.indexOf(jobId) + 1;
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      currentJobId: this.currentJobId,
      isProcessing: this.isProcessing,
      totalJobs: this.jobs.size,
    };
  }

  async cancelJob(userId: string, jobId: string): Promise<boolean> {
    const job = this.jobs.get(jobId);
    
    if (!job || job.userId !== userId) {
      return false;
    }

    if (job.status === 'queued') {
      // Remove from queue
      const queueIndex = this.queue.indexOf(jobId);
      if (queueIndex > -1) {
        this.queue.splice(queueIndex, 1);
      }
      job.status = 'error';
      job.logs.push('Job cancelled by user');
      return true;
    }

    if (job.status === 'in-progress' && job.abortController) {
      // Abort running job - the processQueue loop will handle cleanup
      job.abortController.abort();
      job.logs.push('Job cancelled by user');
      logger.info(`Abort signal sent for job ${jobId}`);
      return true;
    }

    return false;
  }

  // Cleanup completed jobs older than 1 hour
  cleanup(): void {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [jobId, job] of this.jobs.entries()) {
      if ((job.status === 'complete' || job.status === 'error') && 
          job.queuedAt < oneHourAgo) {
        this.jobs.delete(jobId);
      }
    }
  }
}

// Singleton instance
export const userJobManager = new UserJobManager();

// Cleanup old jobs every 30 minutes
setInterval(() => {
  userJobManager.cleanup();
}, 30 * 60 * 1000);