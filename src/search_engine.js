import { tavily } from '@tavily/core';
import { chromium } from 'playwright';
import { LINKEDIN_LI_AT, TAVILY_API_KEY } from './config.js';

export async function searchLinkedInPosts(keywords, maxResults = 5) {
  if (LINKEDIN_LI_AT) {
    let browser;
    try {
      browser = await chromium.launch({ channel: 'chrome', headless: true });
      const context = await browser.newContext();
      await context.addCookies([{
        name: 'li_at',
        value: LINKEDIN_LI_AT,
        domain: '.www.linkedin.com',
        path: '/',
      }]);
      const page = await context.newPage();
      const url = `https://www.linkedin.com/search/results/content/?keywords=${encodeURIComponent(keywords)}&origin=GLOBAL_SEARCH_HEADER&sortBy=%22date_posted%22`;
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector('.feed-shared-update-v2, .search-results__list', { timeout: 10000 }).catch(() => {});

      const results = await page.evaluate((max) => {
        const items = [];
        document.querySelectorAll('.feed-shared-update-v2').forEach(el => {
          if (items.length >= max) return;
          const content = el.querySelector('.feed-shared-text')?.innerText?.trim() || '';
          const linkEl = el.querySelector('a[href*="/posts/"], a[href*="/activity/"]');
          const postUrl = linkEl?.href || '';
          const title = content.split('\n')[0] || '';
          if (content) {
            items.push({ title, url: postUrl, content });
          }
        });
        return items;
      }, maxResults);

      await browser.close();
      return results;
    } catch (err) {
      if (browser) await browser.close().catch(() => {});
    }
  }

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
