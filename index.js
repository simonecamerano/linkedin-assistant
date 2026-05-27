/**
 * @module index
 * Entry point for the automated LinkedIn Assistant pipeline.
 *
 * Orchestrates the full end-to-end flow on each invocation:
 *   1. Load the user's LinkedIn profile (live scrape or local CV fallback).
 *   2. Search LinkedIn for recent posts across predefined topic queries.
 *   3. Deduplicate posts by URL and skip ones already seen in previous runs.
 *   4. For each new post: run a fast triage filter, then a deep SSI analysis.
 *   5. Apply a minimum relevance score threshold before including a post.
 *   6. Batch all approved suggestions into Telegram messages (respecting the
 *      4096-character message size limit) and send the digest.
 *
 * Run with: `npm start`
 */

import { scrapeUserProfile } from './src/linkedin_scraper.js';
import { searchLinkedInPosts } from './src/search_engine.js';
import { eseguiTriagePost } from './src/triage_filter.js';
import { analizzaPostPerSSI } from './src/ssi_analyzer.js';
import { loadSeen, saveSeen } from './src/seen_store.js';
import { inviaATelegram } from './src/telegram_sender.js';
import { MIN_MATCH_SCORE } from './src/config.js';

/** Promisified setTimeout — used to add a 1-second delay between API calls to avoid rate limits. */
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Runs the full LinkedIn assistant pipeline: scrape → search → triage →
 * analyse → send Telegram digest.
 *
 * Marks every encountered post URL as "seen" (regardless of whether it passed
 * the filter) so that it is never re-processed in subsequent runs.
 *
 * @returns {Promise<void>}
 */
async function runLinkedinAssistant() {
  console.log('=====================================================');
  console.log(`🚀 LINKEDIN ASSISTANT STARTED: ${new Date().toLocaleString()}`);
  console.log('=====================================================');

  console.log('👤 Loading profile information...');
  const profile = await scrapeUserProfile();

  // Topic queries that define the user's areas of interest.
  // Adding or removing entries here changes what the bot searches for.
  const queries = [
    'Vue.js Node.js',
    'AI automation workflows',
    'career transition developer'
  ];

  console.log('🔍 Searching recent posts...');
  let rawPosts = [];
  for (const q of queries) {
    const posts = await searchLinkedInPosts(q, 5);
    rawPosts = [...rawPosts, ...posts];
  }

  // Deduplicate by URL: if the same post appears in multiple query results,
  // keep only the first occurrence.  Posts without a URL are discarded
  // because they cannot be linked back to LinkedIn.
  const uniquePosts = Array.from(
    new Map(rawPosts.filter(p => p.url).map(p => [p.url, p])).values()
  );
  console.log(`📊 Found ${uniquePosts.length} unique posts.`);

  const seen = loadSeen();
  const newPosts = uniquePosts.filter(p => !seen.has(p.url));
  console.log(`🗂  ${newPosts.length} new posts after filtering seen ones.`);

  if (newPosts.length === 0) {
    console.log('🏁 No new posts to process. Exiting.');
    return;
  }

  const approvedCards = [];

  for (const post of newPosts) {
    console.log(`\n⏳ Checking post: "${post.title || 'Untitled'}"...`);
    const passed = await eseguiTriagePost(post);

    if (passed) {
      console.log(`🔥 [APPROVED] Post matches criteria. Running SSI analysis...`);
      const report = await analizzaPostPerSSI(post, profile);

      // Parse the PERTINENZA percentage from the structured report.
      // If the model omits it (malformed response), score is null and the
      // post is kept — we only drop posts with an explicit low score.
      const match = report.match(/PERTINENZA[^:]*:\s*(\d+)%/i);
      const score = match ? parseInt(match[1], 10) : null;

      if (score !== null && score < MIN_MATCH_SCORE) {
        console.log(`📉 [FILTERED] Score ${score}% is below threshold (${MIN_MATCH_SCORE}%).`);
      } else {
        // Wrap the report in a card template that includes a direct link to the post.
        const card = `💼 <b>POST SUGGESTION</b>\n\n${report}\n\n🔗 <a href="${post.url}">View original post</a>`;
        approvedCards.push(card);
      }
    } else {
      console.log(`❌ [REJECTED] Post does not match.`);
    }

    // Mark as seen regardless of outcome to avoid re-processing on next run.
    seen.add(post.url);
    // Brief pause between iterations to stay within API rate limits.
    await wait(1000);
  }

  saveSeen(seen);

  if (approvedCards.length === 0) {
    console.log('🏁 No matches found today.');
    return;
  }

  console.log(`\n📬 Sending ${approvedCards.length} suggestion(s) to Telegram...`);

  // Build the digest by concatenating cards into messages that stay under
  // Telegram's 4096-character limit.  When adding the next card would
  // exceed ~4000 chars, flush the current buffer first and start a new one.
  let buffer = `🔔 <b>LINKEDIN ASSISTANT SUGGESTIONS</b>\n`;
  buffer += `${approvedCards.length} relevant post(s) found today for interactions.\n\n`;
  buffer += `═`.repeat(15) + `\n\n`;

  let sentCount = 0;
  for (const card of approvedCards) {
    if ((buffer + card).length > 4000) {
      // Current buffer is full — send it before appending the next card.
      const sent = await inviaATelegram(buffer);
      if (sent) sentCount++;
      buffer = `📦 <b>SUGGESTIONS (Continued...)</b>\n\n`;
    }
    buffer += card + `\n\n` + `═`.repeat(15) + `\n\n`;
  }

  // Send whatever remains in the buffer after the loop ends.
  if (buffer.trim() !== '') {
    const sent = await inviaATelegram(buffer);
    if (sent) sentCount++;
  }

  console.log(`✅ Pipeline completed. Total messages sent: ${sentCount}`);
}

runLinkedinAssistant().catch(console.error);
