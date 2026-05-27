import { scrapeUserProfile } from './src/linkedin_scraper.js';
import { searchLinkedInPosts } from './src/search_engine.js';
import { eseguiTriagePost } from './src/triage_filter.js';
import { analizzaPostPerSSI } from './src/ssi_analyzer.js';
import { loadSeen, saveSeen } from './src/seen_store.js';
import { inviaATelegram } from './src/telegram_sender.js';
import { MIN_MATCH_SCORE } from './src/config.js';

const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

async function runLinkedinAssistant() {
  console.log('=====================================================');
  console.log(`🚀 LINKEDIN ASSISTANT STARTED: ${new Date().toLocaleString()}`);
  console.log('=====================================================');

  console.log('👤 Loading profile information...');
  const profile = await scrapeUserProfile();

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
      
      const match = report.match(/PERTINENZA[^:]*:\s*(\d+)%/i);
      const score = match ? parseInt(match[1], 10) : null;

      if (score !== null && score < MIN_MATCH_SCORE) {
        console.log(`📉 [FILTERED] Score ${score}% is below threshold (${MIN_MATCH_SCORE}%).`);
      } else {
        const card = `💼 <b>POST SUGGESTION</b>\n\n${report}\n\n🔗 <a href="${post.url}">View original post</a>`;
        approvedCards.push(card);
      }
    } else {
      console.log(`❌ [REJECTED] Post does not match.`);
    }

    seen.add(post.url);
    await wait(1000);
  }

  saveSeen(seen);

  if (approvedCards.length === 0) {
    console.log('🏁 No matches found today.');
    return;
  }

  console.log(`\n📬 Sending ${approvedCards.length} suggestion(s) to Telegram...`);

  let buffer = `🔔 <b>LINKEDIN ASSISTANT SUGGESTIONS</b>\n`;
  buffer += `${approvedCards.length} relevant post(s) found today for interactions.\n\n`;
  buffer += `═`.repeat(15) + `\n\n`;

  let sentCount = 0;
  for (const card of approvedCards) {
    if ((buffer + card).length > 4000) {
      const sent = await inviaATelegram(buffer);
      if (sent) sentCount++;
      buffer = `📦 <b>SUGGESTIONS (Continued...)</b>\n\n`;
    }
    buffer += card + `\n\n` + `═`.repeat(15) + `\n\n`;
  }

  if (buffer.trim() !== '') {
    const sent = await inviaATelegram(buffer);
    if (sent) sentCount++;
  }

  console.log(`✅ Pipeline completed. Total messages sent: ${sentCount}`);
}

runLinkedinAssistant().catch(console.error);
