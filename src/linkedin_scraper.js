import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { LINKEDIN_PROFILE_URL, LINKEDIN_LI_AT } from './config.js';

export async function scrapeUserProfile(profileUrl = LINKEDIN_PROFILE_URL, cookieVal = LINKEDIN_LI_AT) {
  if (!cookieVal) {
    return fs.readFileSync(path.resolve('data/cv.md'), 'utf-8');
  }

  let browser;
  try {
    browser = await chromium.launch({ channel: 'chrome', headless: true });
    const context = await browser.newContext();
    await context.addCookies([{
      name: 'li_at',
      value: cookieVal,
      domain: '.www.linkedin.com',
      path: '/',
    }]);
    const page = await context.newPage();
    await page.goto(profileUrl, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('h1', { timeout: 10000 }).catch(() => {});

    const text = await page.evaluate(() => {
      const name = document.querySelector('h1')?.innerText?.trim() || '';
      const headline = document.querySelector('.text-body-medium')?.innerText?.trim() || '';
      const about = document.querySelector('#about ~ .pvs-list__outer-container, #about + div')?.innerText?.trim() || '';
      const experience = document.querySelector('#experience ~ .pvs-list__outer-container')?.innerText?.trim() || '';
      return [name, headline, about, experience].filter(Boolean).join('\n\n');
    });

    await browser.close();
    return text;
  } catch (err) {
    if (browser) await browser.close().catch(() => {});
    return fs.readFileSync(path.resolve('data/cv.md'), 'utf-8');
  }
}

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
      domain: '.www.linkedin.com',
      path: '/',
    }]);
    const page = await context.newPage();
    await page.goto(`${profileUrl}/recent-activity/all/`, { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.feed-shared-update-v2', { timeout: 10000 }).catch(() => {});

    const results = await page.evaluate(() => {
      const items = [];
      document.querySelectorAll('.feed-shared-update-v2').forEach(el => {
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
