/**
 * @module seen_store
 * Provides a simple file-backed Set that tracks which LinkedIn post URLs have
 * already been processed.  Persisting seen URLs across runs prevents the bot
 * from re-analysing the same post on every execution.
 */

import fs from 'fs';
import path from 'path';

/** Default storage path relative to the process working directory. */
const DEFAULT_PATH = path.join(process.cwd(), 'data', 'seen_urls.json');

/**
 * Loads the set of previously seen post URLs from disk.
 *
 * @param {string} [filePath=DEFAULT_PATH] - Path to the JSON file that stores seen URLs.
 * @returns {Set<string>} A Set of URL strings.  Returns an empty Set when the
 *   file does not yet exist (first run), and re-throws any other I/O error.
 */
export function loadSeen(filePath = DEFAULT_PATH) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new Set(data);
  } catch (error) {
    // ENOENT is expected on the first run — treat it as an empty history.
    if (error.code === 'ENOENT') {
      return new Set();
    }
    throw error;
  }
}

/**
 * Persists the current set of seen URLs to disk as a JSON array.
 * Creates the `data/` directory if it does not already exist.
 *
 * @param {Set<string>} seenSet - The Set of URLs to persist.
 * @param {string} [filePath=DEFAULT_PATH] - Destination file path.
 * @returns {void}
 */
export function saveSeen(seenSet, filePath = DEFAULT_PATH) {
  const dir = path.dirname(filePath);
  // Ensure the data directory exists before writing (handles first run).
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  // Spread the Set into an array so JSON.stringify can serialise it.
  fs.writeFileSync(filePath, JSON.stringify([...seenSet], null, 2));
}
