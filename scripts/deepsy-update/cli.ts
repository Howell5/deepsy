/** Shared command-line failure handling for deepsy update scripts. */

/**
 * Run one update command and report a concise failure before exiting.
 * @param main - Command entry point.
 * @returns Nothing; failures terminate the process.
 */
export function runUpdateCli(main: () => Promise<void>): void {
  void main().catch((error: unknown) => {
    console.error(`[deepsy-update] ${error instanceof Error ? error.message : String(error)}`)
    process.exit(1)
  })
}
