/**
 * @module linkedin_scraper
 * Provides two Playwright-based scrapers for the user's own LinkedIn profile:
 * one for profile text (name, headline, about, experience) and one for recent
 * activity (posts and comments).  Both functions degrade gracefully — when no
 * session cookie is configured they return local fallback data rather than
 * throwing, so the rest of the pipeline can still run offline or in CI.
 */

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { LINKEDIN_PROFILE_URL, LINKEDIN_LI_AT } from './config.js';

/**
 * Scrapes the user's LinkedIn profile and returns a plain-text summary
 * containing their name, headline, about section, and work experience.
 *
 * When no LinkedIn session cookie (`li_at`) is configured, the function reads
 * `data/cv.md` as a static fallback so the bot can still generate suggestions
 * based on locally stored profile data.
 *
 * @param {string} [profileUrl=LINKEDIN_PROFILE_URL] - Full URL of the LinkedIn profile to scrape.
 * @param {string} [cookieVal=LINKEDIN_LI_AT] - Value of the `li_at` session cookie for authentication.
 * @returns {Promise<string>} Plain-text profile summary, or the contents of `data/cv.md` on failure.
 */
export async function scrapeUserProfile(profileUrl = LINKEDIN_PROFILE_URL, cookieVal = LINKEDIN_LI_AT) {
  // No cookie means we cannot authenticate — fall back to the local CV file.
  if (!cookieVal) {
    return fs.readFileSync(path.resolve('data/cv.md'), 'utf-8');
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();

    // Inject the session cookie so LinkedIn treats the request as authenticated.
    await context.addCookies([{
      name: 'li_at',
      value: cookieVal,
      domain: '.linkedin.com',
      path: '/',
    }]);

    const page = await context.newPage();
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });

    // Wait for the profile name heading but don't fail if it times out —
    // some profiles load the heading lazily.
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

    // Extract the four key sections via DOM evaluation inside the browser context.
    const text = await page.evaluate(() => {
      const name = document.querySelector('h1')?.innerText?.trim() || '';
      const headline = document.querySelector('.text-body-medium')?.innerText?.trim() || '';
      // LinkedIn renders the About section differently depending on layout version;
      // try both the sibling container and the direct div approach.
      const about = document.querySelector('#about ~ .pvs-list__outer-container, #about + div')?.innerText?.trim() || '';
      const experience = document.querySelector('#experience ~ .pvs-list__outer-container')?.innerText?.trim() || '';
      // Join only the sections that actually returned content.
      return [name, headline, about, experience].filter(Boolean).join('\n\n');
    });

    await browser.close();
    return text;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    // On any scraping failure, fall back to the local file rather than
    // propagating an error that would abort the entire pipeline.
    return fs.readFileSync(path.resolve('data/cv.md'), 'utf-8');
  }
}

/**
 * Scrapes the user's recent LinkedIn activity feed and returns an array of
 * post and comment objects.
 *
 * Returns an empty array instead of throwing when no session cookie is
 * available or when scraping fails, keeping the pipeline fault-tolerant.
 *
 * @param {string} [profileUrl=LINKEDIN_PROFILE_URL] - Full URL of the LinkedIn profile.
 * @param {string} [cookieVal=LINKEDIN_LI_AT] - Value of the `li_at` session cookie.
 * @returns {Promise<Array<{type: 'post'|'comment', text: string, url: string}>>}
 *   Array of activity items; empty array if not authenticated or on error.
 */
export async function scrapeUserActivity(profileUrl = LINKEDIN_PROFILE_URL, cookieVal = LINKEDIN_LI_AT) {
  if (!cookieVal) {
    return [];
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();
    await context.addCookies([{
      name: 'li_at',
      value: cookieVal,
      domain: '.linkedin.com',
      path: '/',
    }]);

    const page = await context.newPage();
    // The `/recent-activity/all/` sub-path shows the chronological feed.
    await page.goto(`${profileUrl}/recent-activity/all/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.feed-shared-update-v2', { timeout: 10000 }).catch(() => {});

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.feed-shared-update-v2').forEach(el => {
        // Distinguish between original posts and comments by looking for the
        // comment-specific child element.
        const isComment = !!el.querySelector('.comments-comment-item');
        const textEl = el.querySelector('.feed-shared-text, .comments-comment-item__main-content');
        const text = textEl?.innerText?.trim() || '';
        const linkEl = el.querySelector('a[href*="/posts/"], a[href*="/activity/"]');
        const url = linkEl?.href || '';
        if (text) {
          items.push({ type: isComment ? 'comment' : 'post', text, url });
        }
      });
      return items;
    });

    await browser.close();
    return results;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return [];
  }
}
