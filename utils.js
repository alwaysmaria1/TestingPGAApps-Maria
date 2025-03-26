/**
 * Extracts and cleans the added code from a raw diff text.
 *
 * This function:
 * - Splits the diff text into lines.
 * - Filters out metadata lines such as headers and hunk markers.
 * - Keeps only lines starting with a '+' (the added code) and removes the '+'.
 *
 * @param diff - The raw diff text.
 * @returns A cleaned string containing only the added code.
 */
export function extractCleanCodeFromDiff(diff: string): string {
    return diff
      .split('\n')
      .filter((line) => {
        // Exclude diff metadata lines.
        if (
          line.startsWith('diff ') ||
          line.startsWith('new file mode') ||
          line.startsWith('index ') ||
          line.startsWith('--- ') ||
          line.startsWith('+++ ') ||
          line.startsWith('@@')
        ) {
          return false;
        }
        // Include only added lines.
        return line.startsWith('+');
      })
      .map((line) => line.replace(/^\+/, '')) // Remove the '+' from the beginning.
      .join('\n')
      .trim();
  }
