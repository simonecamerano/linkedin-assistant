import { describe, test, expect, afterAll } from 'vitest';
import fs from 'fs';
import path from 'path';

import {
  TELEGRAM_BOT_TOKEN,
  TELEGRAM_CHAT_ID,
  MIN_MATCH_SCORE
} from '../src/config.js';
import { loadSeen, saveSeen } from '../src/seen_store.js';

describe('config tests', () => {
  test('TELEGRAM_BOT_TOKEN is a string', () => {
    expect(typeof TELEGRAM_BOT_TOKEN).toBe('string');
  });

  test('TELEGRAM_CHAT_ID is a string', () => {
    expect(typeof TELEGRAM_CHAT_ID).toBe('string');
  });

  test('MIN_MATCH_SCORE is a number', () => {
    expect(typeof MIN_MATCH_SCORE).toBe('number');
  });
});

describe('seen_store tests', () => {
  const tempFilePath = path.join(process.cwd(), 'data', 'temp_seen_urls.json');

  afterAll(() => {
    if (fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }
  });

  test('loadSeen returns empty set when file does not exist', () => {
    const nonExistentPath = path.join(process.cwd(), 'data', 'does_not_exist_file.json');
    const result = loadSeen(nonExistentPath);
    expect(result).toBeInstanceOf(Set);
    expect(result.size).toBe(0);
  });

  test('saveSeen and loadSeen work correctly', () => {
    const urls = new Set(['https://linkedin.com/in/1', 'https://linkedin.com/in/2']);
    saveSeen(urls, tempFilePath);

    const loadedUrls = loadSeen(tempFilePath);
    expect(loadedUrls).toBeInstanceOf(Set);
    expect(loadedUrls.size).toBe(2);
    expect(loadedUrls.has('https://linkedin.com/in/1')).toBe(true);
    expect(loadedUrls.has('https://linkedin.com/in/2')).toBe(true);
  });
});
