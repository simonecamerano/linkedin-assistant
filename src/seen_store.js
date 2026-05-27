import fs from 'fs';
import path from 'path';

const DEFAULT_PATH = path.join(process.cwd(), 'data', 'seen_urls.json');

export function loadSeen(filePath = DEFAULT_PATH) {
  try {
    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    return new Set(data);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return new Set();
    }
    throw error;
  }
}

export function saveSeen(seenSet, filePath = DEFAULT_PATH) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify([...seenSet], null, 2));
}
