import { spawn } from 'child_process';
import fs from 'fs';
import { TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID } from './src/config.js';

if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
  console.error('❌ TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID are required.');
  process.exit(1);
}

const API = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;
let offset = 0;
let running = false;

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

function runScript(script, label) {
  if (running) {
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

async function poll() {
  try {
    const res = await fetch(`${API}/getUpdates?offset=${offset}&timeout=30`);
    const data = await res.json();

    for (const update of data.result ?? []) {
      offset = update.update_id + 1;

      const fromId = String(update.message?.chat?.id);
      const text = update.message?.text?.trim();

      if (fromId !== TELEGRAM_CHAT_ID) continue;

      if (text === '/suggest') {
        runScript('index.js', 'LinkedIn Assistant');
      } else if (text === '/profile') {
        try {
          const profile = fs.readFileSync('data/cv.md', 'utf-8');
          const summary = profile.length > 3000 ? `${profile.substring(0, 3000)}...` : profile;
          await sendMessage(`👤 <b>PROFILO CORRENTE:</b>\n\n${summary}`);
        } catch (err) {
          await sendMessage(`❌ Errore nella lettura del profilo: ${err.message}`);
        }
      } else if (text === '/status') {
        sendMessage(running ? '⏳ Pipeline in esecuzione...' : '💤 Bot in attesa.');
      } else if (text?.startsWith('/')) {
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

  poll();
}

console.log('🤖 LinkedIn Assistant Bot is running. Listening for /suggest, /profile, /status...');
poll();
