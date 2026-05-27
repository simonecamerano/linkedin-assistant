/**
 * @module search_engine
 * Searches LinkedIn for recent posts matching a given keyword query.
 *
 * Strategy (in priority order):
 * 1. If a LinkedIn session cookie is configured, use an authenticated Playwright
 *    browser to hit LinkedIn's native content search (real-time, no API quota).
 * 2. If no cookie is available, fall back to the Tavily web-search API, which
 *    queries `site:linkedin.com/posts/` and returns cached/indexed results.
 */

import { tavily } from '@tavily/core';
import { chromium } from 'playwright';
import { LINKEDIN_LI_AT, TAVILY_API_KEY } from './config.js';

/**
 * Searches LinkedIn for posts related to the given keywords.
 *
 * @param {string} keywords - Space-separated search terms.
 * @param {number} [maxResults=5] - Maximum number of posts to return.
 * @returns {Promise<Array<{title: string, url: string, content: string}>>}
 *   Array of post objects.  Each object has a `title` (first line of the post),
 *   `url` (permalink), and `content` (full text).  Returns an empty array when
 *   the Playwright path fails and no Tavily key is set.
 */
export async function searchLinkedInPosts(keywords, maxResults = 5) {
  if (LINKEDIN_LI_AT) {
    let browser;
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      const context = await browser.newContext();
      await context.addCookies([{
        name: 'li_at',
        value: LINKEDIN_LI_AT,
        domain: '.linkedin.com',
        path: '/',
      }]);

      const page = await context.newPage();
      // Use LinkedIn's content-search endpoint sorted by most recent (`date_posted`)
      // to surface fresh posts rather than algorithmically ranked ones.
      const url = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.feed-shared-update-v2, .search-results__list', { timeout: 10000 }).catch(() => {});

      const results = await page.evaluate((max) => {
        const items = [];
        document.querySelectorAll('.feed-shared-update-v2').forEach(el => {
          // Stop collecting once the requested maximum is reached.
          if (items.length >= max) return;
          const content = el.querySelector('.feed-shared-text')?.innerText?.trim() || '';
          const linkEl = el.querySelector('a[href*="/posts/"], a[href*="/activity/"]');
          const postUrl = linkEl?.href || '';
          // Use the first line of the post body as a synthetic title.
          const title = content.split('\n')[0] || '';
          if (content) {
            items.push({ title, url: postUrl, content });
          }
        });
        return items;
      }, maxResults);

      await browser.close();
      if (results && results.length > 0) {
        return results;
      }
    } catch (err) {
      if (browser) await browser.close().catch(() => {});
      // Fall through to the Tavily fallback below.
    }
  }

  // Tavily fallback: prefix the query with a site filter so results are
  // scoped to LinkedIn post URLs only.
  const client = tavily({ apiKey: TAVILY_API_KEY });
  const response = await client.search(`site:linkedin.com/posts/ ${keywords}`, {
    searchDepth: 'advanced',
    maxResults,
  });

  return response.results.map(r => ({
    title: r.title || '',
    url: r.url || '',
    content: r.content || '',
  }));
}
