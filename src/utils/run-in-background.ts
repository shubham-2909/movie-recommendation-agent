/**
 * Runs a given asynchronous task in the background without blocking the main thread.
 * @param task Function to execute asynchronously.
 */
export function runInBackgroundTask(task: () => Promise<void>): void {
  task()
    .then(() => {
      process.exit(0);
    })
    .catch((error) => {
      console.error("❌ Error occurred in background task:", error);
    });
}
