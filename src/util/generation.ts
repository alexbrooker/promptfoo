import logger from '../logger';
import type { ProgressReporter } from '../redteam/util/progress';

/**
 * Retries an operation with deduplication until the target count is reached or max retries are exhausted.
 *
 * @param operation - A function that takes the current items and returns a Promise of new items.
 * @param targetCount - The desired number of unique items to collect.
 * @param maxConsecutiveRetries - Maximum number of consecutive retries allowed when no new items are found. Defaults to 2.
 * @param dedupFn - A function to deduplicate items. Defaults to using a Set for uniqueness.
 * @param progressReporter - Optional progress reporter for detailed feedback.
 * @param pluginId - Optional plugin ID for progress reporting context.
 * @returns A Promise that resolves to an array of unique items.
 *
 * @typeParam T - The type of items being collected.
 */
export async function retryWithDeduplication<T>(
  operation: (currentItems: T[]) => Promise<T[]>,
  targetCount: number,
  maxConsecutiveRetries: number = 2,
  dedupFn: (items: T[]) => T[] = (items) =>
    Array.from(new Set(items.map((item) => JSON.stringify(item)))).map((item) => JSON.parse(item)),
  progressReporter?: ProgressReporter,
  pluginId?: string,
): Promise<T[]> {
  const allItems: T[] = [];
  let consecutiveRetries = 0;
  let attempt = 0;
  const maxRetries = maxConsecutiveRetries + 1;

  while (allItems.length < targetCount && consecutiveRetries <= maxConsecutiveRetries) {
    attempt++;
    
    if (progressReporter && pluginId) {
      progressReporter.reportRetryAttempt(
        pluginId,
        attempt,
        maxRetries,
        allItems.length,
        targetCount,
        0, // Will be updated after operation
        0  // Will be updated after operation
      );
    }
    
    const newItems = await operation(allItems);

    if (!Array.isArray(newItems)) {
      const message = 'Operation returned non-iterable result. Skipping this iteration.';
      logger.warn(pluginId ? `[${pluginId}] ${message}` : message);
      consecutiveRetries++;
      continue;
    }

    const uniqueNewItems = dedupFn([...allItems, ...newItems]).slice(allItems.length);
    allItems.push(...uniqueNewItems);

    // Report detailed progress
    if (progressReporter && pluginId) {
      progressReporter.reportRetryAttempt(
        pluginId,
        attempt,
        maxRetries,
        allItems.length,
        targetCount,
        newItems.length,
        uniqueNewItems.length
      );
    } else {
      logger.debug(`Added ${uniqueNewItems.length} unique items. Total: ${allItems.length}`);
    }

    if (uniqueNewItems.length === 0) {
      consecutiveRetries++;
      const message = `No new unique items. Consecutive retries: ${consecutiveRetries}`;
      logger.debug(pluginId ? `[${pluginId}] ${message}` : message);
    } else {
      consecutiveRetries = 0;
    }
  }

  if (allItems.length < targetCount) {
    const message = `Retry exhausted: collected ${allItems.length}/${targetCount} items after ${attempt} attempts`;
    logger.warn(pluginId ? `[${pluginId}] ${message}` : message);
  }

  return allItems;
}

/**
 * Randomly samples n items from an array.
 * If n is greater than the length of the array, the entire array is returned.
 *
 * @param array The array to sample from
 * @param n The number of items to sample
 * @returns A new array with n randomly sampled items
 */
export function sampleArray<T>(array: T[], n: number): T[] {
  const actualSample = Math.min(n, array.length);
  logger.debug(`Sampling ${actualSample} items from array of length ${array.length}`);
  
  if (actualSample === array.length) {
    return array.slice();
  }
  
  const shuffled = array.slice().sort(() => 0.5 - Math.random());
  return shuffled.slice(0, actualSample);
}
