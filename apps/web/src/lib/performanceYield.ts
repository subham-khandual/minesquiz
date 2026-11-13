/**
 * Modern Web Guidance: Break Up Long Tasks
 * Yield control back to the browser periodically using scheduler.yield()
 * with setTimeout fallback to maintain high INP (<200ms) responsiveness.
 */

export async function yieldToMainThread(): Promise<void> {
  if (typeof window !== 'undefined' && 'scheduler' in window && typeof (window as any).scheduler?.yield === 'function') {
    await (window as any).scheduler.yield();
  } else {
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}

/**
 * Execute a long array transformation with cooperative multitasking,
 * checking a 50ms budget deadline per Google Chrome INP best practices.
 */
export async function chunkedIterate<T>(
  items: T[],
  handler: (item: T, index: number) => void,
  budgetMs = 50
): Promise<void> {
  let deadline = performance.now() + budgetMs;

  for (let i = 0; i < items.length; i++) {
    handler(items[i], i);

    if (performance.now() >= deadline) {
      await yieldToMainThread();
      deadline = performance.now() + budgetMs;
    }
  }
}
