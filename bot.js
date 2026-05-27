/**
 * @module bot
 * Interactive Telegram bot that acts as a command interface for the LinkedIn
 * Assistant pipeline.
 *
 * Uses long-polling (`getUpdates` with `timeout=30`) instead of webhooks so
 * no public URL or TLS certificate is required — the bot works from any
 * machine that has outbound HTTPS access.
 *
 * Supported commands:
 *   /suggest  — trigger the full LinkedIn assistant pipeline (index.js)
 *   /profile  — display the currently loaded profile / CV
 *   /status   — report whether a pipeline run is currently in progress
 *
 * Only messages from the configured `TELEGRAM_CHAT_ID` are processed;
 * all others are silently ignored.
 *
 * Run with: `npm run bot`
 */

import { spawn } from 'child_process';
import fs from 'fs';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './src/config.js';

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.');
  process.exit(1);
}

/** Base URL for all Telegram Bot API requests. */
const API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

/**
 * Tracks the update_id of the last processed Telegram update.
 * Passing `offset = last_update_id + 1` to getUpdates tells Telegram to
 * acknowledge all previous updates and return only new ones.
 */
let offset = 0;

/**
 * Guards against concurrent pipeline executions.
 * A second `/suggest` while one is running is rejected with a warning message
 * rather than spawning a parallel process that would compete for resources.
 */
let running = false;

/**
 * Sends a plain-text (HTML parse mode) message to the configured Telegram chat.
 *
 * @param {string} text - Message text; may contain HTML tags understood by Telegram.
 * @returns {Promise<void>}
 */
async function sendMessage(text) {
  try {
    await fetch(`${API}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: TELEGRAM_CHAT_ID, text, parse_mode: 'HTML' }),
    });
  } catch (err) {
    console.error('❌ Failed to send Telegram message:', err.message);
  }
}

/**
 * Spawns a child Node.js process to run the given script file and notifies
 * the user via Telegram when it finishes.
 *
 * The `running` flag is set to `true` for the duration of the child process
 * and cleared in the `close` handler to allow the next invocation.
 * `stdio: 'inherit'` forwards the child's stdout/stderr to the parent
 * terminal so pipeline logs are visible when running interactively.
 *
 * @param {string} script - Path to the Node.js script to execute (e.g. `"index.js"`).
 * @param {string} label  - Human-readable label used in Telegram status messages.
 * @returns {void}
 */
function runScript(script, label) {
  if (running) {
    // Prevent stacking multiple pipeline runs on top of each other.
    sendMessage('⚠️ Una pipeline è già in esecuzione. Attendi che finisca.');
    return;
  }

  running = true;
  sendMessage(`🚀 <b>${label}</b> avviato...`);

  const child = spawn('node', [script], { stdio: 'inherit' });

  child.on('close', (code) => {
    running = false;
    if (code === 0) {
      sendMessage(`✅ <b>${label}</b> completato.`);
    } else {
      sendMessage(`❌ <b>${label}</b> terminato con errore (codice ${code}).`);
    }
  });
}

/**
 * Long-polls the Telegram Bot API for new updates and dispatches each
 * incoming command.
 *
 * Calls itself recursively at the end of each cycle so polling continues
 * indefinitely without a `setInterval`, making it easy to reason about
 * sequential processing (one batch of updates is fully handled before the
 * next request is made).
 *
 * @returns {Promise<void>}
 */
async function poll() {
  try {
    // `timeout=30` keeps the connection open for up to 30 seconds waiting
    // for an update — this is standard long-polling and avoids hammering the
    // Telegram servers with rapid empty responses.
    const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    for (const update of data.result ?? []) {
      // Advance the offset so this update is acknowledged and won't be
      // returned again in the next poll request.
      offset = update.update_id + 1;

      const fromId = String(update.message?.chat?.id);
      const text = update.message?.text?.trim();

      // Security gate: ignore messages from any chat other than the owner's.
      if (fromId !== TELEGRAM_CHAT_ID) continue;

      if (text === '/suggest') {
        runScript('index.js', 'LinkedIn Assistant');
      } else if (text === '/profile') {
        try {
          const profile = fs.readFileSync('data/cv.md', 'utf-8');
          // Truncate long CVs to avoid hitting Telegram's 4096-char message limit.
          const summary = profile.length > 3000 ? `${profile.substring(0, 3000)}...` : profile;
          await sendMessage(`👤 <b>PROFILO CORRENTE:</b>\n\n${summary}`);
        } catch (err) {
          await sendMessage(`❌ Errore nella lettura del profilo: ${err.message}`);
        }
      } else if (text === '/status') {
        sendMessage(running ? '⏳ Pipeline in esecuzione...' : '💤 Bot in attesa.');
      } else if (text?.startsWith('/')) {
        // Unknown command — show the help menu.
        sendMessage(
          'Comandi disponibili:\n' +
          '/suggest — avvia la ricerca di post e suggerimento commenti\n' +
          '/profile — mostra il profilo e CV correntemente caricato\n' +
          '/status — controlla se una pipeline è in corso'
        );
      }
    }
  } catch (err) {
    console.error('❌ Poll error:', err.message);
  }

  // Schedule the next poll immediately after the current one completes,
  // creating a continuous loop without blocking the event loop.
  poll();
}

console.log('🤖 LinkedIn Assistant Bot is running. Listening for /suggest, /profile, /status...');
poll();
