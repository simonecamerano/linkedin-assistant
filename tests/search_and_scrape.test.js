import { describe, test, expect, vi } from 'vitest';
import fs from 'fs';
import { scrapeUserProfile, scrapeUserActivity } from '../src/linkedin_scraper.js';
import { searchLinkedInPosts } from '../src/search_engine.js';
import { chromium } from 'playwright';
import { tavily } from '@tavily/core';

vi.mock('playwright', () => ({
  chromium: {
    launch: vi.fn(),
  },
}));

vi.mock('@tavily/core', () => {
  const mockSearch = vi.fn();
  return {
    tavily: vi.fn(() => ({
      search: mockSearch,
    })),
    mockSearch,
  };
});

vi.mock('../src/config.js', () => ({
  LINKEDIN_PROFILE_URL: 'https://linkedin.com/in/test-profile',
  LINKEDIN_LI_AT: '',
  TAVILY_API_KEY: 'test-tavily-key',
}));

describe('linkedin_scraper tests', () => {
  test('scrapeUserProfile reads cv.md if cookie is missing', async () => {
    const fsSpy = vi.spyOn(fs, 'readFileSync');
    const result = await scrapeUserProfile('https://linkedin.com/in/test-profile', '');
    expect(fsSpy).toHaveBeenCalled();
    expect(result).toContain('Simone Camerano');
    fsSpy.mockRestore();
  });

  test('scrapeUserActivity returns empty array if cookie is missing', async () => {
    const result = await scrapeUserActivity('https://linkedin.com/in/test-profile', '');
    expect(result).toEqual([]);
  });

  test('scrapeUserProfile launches Playwright if cookie is provided', async () => {
    const mockPage = {
      goto: vi.fn(),
      waitForSelector: vi.fn().mockResolvedValue(true),
      evaluate: vi.fn().mockResolvedValue('Scraped Name\nScraped Headline'),
    };
    const mockContext = {
      addCookies: vi.fn(),
      newPage: vi.fn().mockResolvedValue(mockPage),
    };
    const mockBrowser = {
      newContext: vi.fn().mockResolvedValue(mockContext),
      close: vi.fn(),
    };

    chromium.launch.mockResolvedValue(mockBrowser);

    const result = await scrapeUserProfile('https://linkedin.com/in/test-profile', 'valid-cookie');
    expect(chromium.launch).toHaveBeenCalledWith({ channel: 'chrome', headless: true });
    expect(mockContext.addCookies).toHaveBeenCalled();
    expect(mockPage.goto).toHaveBeenCalledWith('https://linkedin.com/in/test-profile', { waitUntil: 'domcontentloaded' });
    expect(result).toBe('Scraped Name\nScraped Headline');
  });
});

describe('search_engine tests', () => {
  test('searchLinkedInPosts falls back to Tavily', async () => {
    const core = await import('@tavily/core');
    const instance = core.tavily();
    instance.search.mockResolvedValue({
      results: [
        { title: 'Tavily Post 1', url: 'https://linkedin.com/posts/1', content: 'Content 1' }
      ]
    });

    const results = await searchLinkedInPosts('Vue.js', 5);
    expect(results).toHaveLength(1);
    expect(results[0]).toEqual({
      title: 'Tavily Post 1',
      url: 'https://linkedin.com/posts/1',
      content: 'Content 1'
    });
  });
});
