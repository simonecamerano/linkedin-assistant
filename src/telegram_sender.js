/**
 * @module telegram_sender
 * Thin wrapper around the Telegram Bot API for sending HTML messages.
 *
 * LinkedIn post reports are authored in a simple subset of Markdown
 * (`**bold**` and `[text](url)` links).  Telegram's `parse_mode: 'HTML'`
 * requires those constructs to be converted to HTML tags before sending,
 * which is what `convertiMarkdownInHtml` handles.
 */

import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './config.js';

/**
 * Converts a limited subset of Markdown syntax to Telegram-safe HTML.
 *
 * Handles (in order):
 * 1. HTML entity escaping (`&`, `<`, `>`) to prevent injection into the
 *    HTML message body sent to Telegram.
 * 2. `**bold**` → `<b>bold</b>`
 * 3. `[text](url)` → `<a href="url">text</a>`
 *
 * Escaping must happen first — if `<b>` were emitted before escaping,
 * the `<` character would be re-escaped and the tag would break.
 *
 * @param {string} text - Input string with optional Markdown formatting.
 * @returns {string} HTML string safe to send via the Telegram Bot API.
 */
function convertiMarkdownInHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
    .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>');
}

/**
 * Sends a text message to the configured Telegram chat.
 *
 * The message is converted from Markdown to HTML before sending.
 * `disable_web_page_preview: true` prevents Telegram from generating a
 * large link preview card for every URL in the digest, which would make
 * messages unwieldy when multiple posts are batched together.
 *
 * @param {string} testo - Message text (may contain `**bold**` and `[link](url)` Markdown).
 * @returns {Promise<boolean>} `true` if the API call succeeded, `false` on any error.
 */
async function inviaATelegram(testo) {
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID');
    return false;
  }

  try {
    const response = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: convertiMarkdownInHtml(testo),
        parse_mode: 'HTML',
        disable_web_page_preview: true
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Error sending message to Telegram:', error);
    return false;
  }
}

export { convertiMarkdownInHtml, inviaATelegram };
