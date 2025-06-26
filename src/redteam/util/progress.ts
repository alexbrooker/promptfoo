import logger from '../../logger';

export interface ProgressEvent {
  phase: 'initialization' | 'plugin_generation' | 'strategy_application' | 'completion';
  plugin?: string;
  strategy?: string;
  completed: number;
  total: number;
  message: string;
  timeElapsed: number;
}

export type ProgressCallback = (event: ProgressEvent) => void;

export class ProgressReporter {
  private startTime = Date.now();
  private lastUpdate = 0;
  private lastPeriodicReport = 0;
  private progressCallback?: ProgressCallback;

  constructor(progressCallback?: ProgressCallback) {
    this.progressCallback = progressCallback;
    
    // Start a periodic heartbeat to show the process is alive
    this.startHeartbeat();
  }
  
  private startHeartbeat() {
    // Send a heartbeat every 30 seconds to show process is alive
    setInterval(() => {
      this.reportIfNeeded('Process running... (heartbeat)', false);
    }, 30000);
  }

  reportProgress(
    phase: ProgressEvent['phase'],
    message: string,
    completed: number,
    total: number,
    options: { plugin?: string; strategy?: string; force?: boolean } = {}
  ) {
    const now = Date.now();
    const timeElapsed = now - this.startTime;
    
    const event: ProgressEvent = {
      phase,
      message,
      completed,
      total,
      timeElapsed,
      plugin: options.plugin,
      strategy: options.strategy,
    };

    // Always emit to callback if available
    if (this.progressCallback) {
      this.progressCallback(event);
    }

    // Log based on force flag or time threshold
    const shouldLog = options.force || (now - this.lastUpdate) > 5000; // Every 5 seconds
    
    if (shouldLog) {
      const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
      const elapsedSeconds = Math.floor(timeElapsed / 1000);
      const identifier = options.plugin || options.strategy || '';
      const prefix = identifier ? `[${identifier}]` : '';
      
      logger.info(`${prefix} [${percent}%] ${message} (${completed}/${total}) [${elapsedSeconds}s]`);
      this.lastUpdate = now;
    }
  }

  reportIfNeeded(message: string, force = false) {
    const now = Date.now();
    const elapsed = now - this.startTime;
    
    // Report every 30 seconds or if forced
    if (force || (now - this.lastPeriodicReport) > 30000) {
      logger.info(`[${Math.floor(elapsed / 1000)}s] ${message}`);
      this.lastPeriodicReport = now;
    }
  }

  reportPluginProgress(pluginId: string, message: string, completed: number, total: number) {
    this.reportProgress('plugin_generation', message, completed, total, { plugin: pluginId });
  }

  reportStrategyProgress(strategyId: string, message: string, completed: number, total: number) {
    this.reportProgress('strategy_application', message, completed, total, { strategy: strategyId });
  }

  reportApiCall(pluginId: string, attempt: number, maxRetries: number, batchSize: number) {
    const message = `Making API call (attempt ${attempt}/${maxRetries}) for ${batchSize} prompts`;
    logger.debug(`[${pluginId}] ${message}`);
  }

  reportRetryAttempt(
    pluginId: string, 
    attempt: number, 
    maxRetries: number, 
    currentCount: number, 
    targetCount: number,
    newItems: number,
    uniqueItems: number
  ) {
    const message = `Retry ${attempt}/${maxRetries}: Got ${newItems} items, ${uniqueItems} unique. Progress: ${currentCount}/${targetCount}`;
    logger.debug(`[${pluginId}] ${message}`);
  }

  getElapsedTime(): number {
    return Date.now() - this.startTime;
  }

  getElapsedSeconds(): number {
    return Math.floor(this.getElapsedTime() / 1000);
  }
}