/** Read a complete loopback startup URL, including the authentication token. */

/** @param output - buffered backend stdout. @returns the URL after its complete line arrives. */
export function backendReadyUrl(output: string): string | undefined {
  return /(?:^|\n)dsh web: (http:\/\/127\.0\.0\.1:\d+[^\s]*)(?:[^\n]*)\r?\n/.exec(output)?.[1]
}
