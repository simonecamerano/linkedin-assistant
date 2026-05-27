# LinkedIn Assistant

An AI-powered LinkedIn interaction bot that automatically discovers relevant posts, evaluates them against your professional profile, and delivers actionable engagement suggestions — complete with ready-to-paste comment drafts — directly to your Telegram chat.

It also serves as an SSI (Social Selling Index) optimizer: every suggestion is framed as a strategic engagement opportunity aligned to your personal brand.

---

## Features

- **Automated post discovery** — searches LinkedIn (authenticated scrape or Tavily fallback) across configurable topic queries.
- **Two-stage AI filtering** — a fast Groq triage model eliminates irrelevant posts cheaply; only approved posts reach the deeper DeepSeek analysis.
- **SSI strategy reports** — each approved post produces a relevance score, a strategic engagement angle, and a polished comment draft.
- **Seen-URL deduplication** — posts already processed in previous runs are skipped, so each digest contains only new content.
- **Telegram digest delivery** — results are batched into Telegram messages that respect the 4096-character limit.
- **Interactive bot** — a long-polling Telegram bot lets you trigger runs and check status on demand.

---

## Architecture Overview

```
index.js  (pipeline entry point)
│
├── linkedin_scraper.js   → Playwright scrape of your own profile + activity
│                           (falls back to data/cv.md when no cookie is set)
│
├── search_engine.js      → Playwright authenticated search OR Tavily API fallback
│                           Returns: [{ title, url, content }]
│
├── triage_filter.js      → Groq LLM (fast, cheap): boolean SI/NO relevance gate
│
├── ssi_analyzer.js       → DeepSeek LLM (deep): SSI report + comment draft
│
├── seen_store.js         → File-backed Set of processed URLs (data/seen_urls.json)
│
└── telegram_sender.js    → Telegram Bot API wrapper (Markdown → HTML conversion)

bot.js  (interactive Telegram bot, long-polling)
└── Dispatches /suggest → spawns index.js as a child process
```

### Data flow

```
Profile scrape
      │
      ▼
Topic search (3 queries × 5 posts)
      │
      ▼
Deduplicate by URL → filter seen URLs
      │
      ▼
For each new post:
  Triage (Groq) ──REJECTED──► skip, mark seen
      │
   APPROVED
      │
      ▼
  SSI Analysis (DeepSeek)
      │
  Score ≥ MIN_MATCH_SCORE?
      │
     YES
      │
      ▼
  Append to Telegram digest

Send batched digest → Telegram
```

---

## Setup

### Prerequisites

- Node.js 20 or later
- A Chromium-compatible browser accessible to Playwright (`npx playwright install chrome`)
- API keys for: Groq, DeepSeek, Telegram Bot, and optionally Tavily

### 1. Install dependencies

```bash
npm install
npx playwright install chrome
```

### 2. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.example .env
```

Open `.env` and set the following variables:

| Variable | Required | Description |
|---|---|---|
| `TELEGRAM_BOT_TOKEN` | Yes | Token from [@BotFather](https://t.me/BotFather) |
| `TELEGRAM_CHAT_ID` | Yes | Your personal Telegram chat ID (use [@userinfobot](https://t.me/userinfobot)) |
| `GROQ_API_KEY` | Yes | API key from [console.groq.com](https://console.groq.com) |
| `DEEPSEEK_API_KEY` | Yes | API key from [platform.deepseek.com](https://platform.deepseek.com) |
| `TAVILY_API_KEY` | No | Required only when `LINKEDIN_LI_AT` is not set |
| `LINKEDIN_LI_AT` | No | LinkedIn session cookie value (enables authenticated scraping) |
| `LINKEDIN_PROFILE_URL` | No | Your LinkedIn profile URL (required if `LINKEDIN_LI_AT` is set) |
| `TRIAGE_MODEL` | Yes | Groq model ID, e.g. `llama3-8b-8192` |
| `ANALYSIS_MODEL` | Yes | DeepSeek model ID, e.g. `deepseek-chat` |
| `MIN_MATCH_SCORE` | No | Minimum relevance % to include a post (default: `70`) |

#### Obtaining `LINKEDIN_LI_AT`

1. Log in to LinkedIn in your browser.
2. Open DevTools → Application → Cookies → `www.linkedin.com`.
3. Copy the value of the `li_at` cookie.

> **Warning:** Do not share your `li_at` cookie. It grants full access to your LinkedIn session.

### 3. (Optional) Add a profile fallback

If you do not set `LINKEDIN_LI_AT`, place your professional profile as plain text or Markdown in `data/cv.md`. The pipeline will use this file instead of scraping LinkedIn.

---

## CLI Commands

| Command | Description |
|---|---|
| `npm start` | Run the full pipeline once and send the digest to Telegram. |
| `npm run bot` | Start the interactive Telegram bot (long-polling, runs until stopped). |
| `npm test` | Run the unit test suite with Vitest. |

---

## Telegram Bot Commands

Once the bot is running (`npm run bot`), send these commands from your Telegram account:

| Command | Description |
|---|---|
| `/suggest` | Trigger a full pipeline run. Results are sent to the same chat when complete. |
| `/profile` | Display the profile / CV currently loaded by the bot (truncated to 3000 chars). |
| `/status` | Report whether a pipeline run is currently in progress. |

Only messages from the configured `TELEGRAM_CHAT_ID` are accepted; all other senders are ignored.

---

## Project Structure

```
.
├── index.js              # Pipeline entry point
├── bot.js                # Interactive Telegram bot
├── src/
│   ├── config.js         # Environment variable loading
│   ├── linkedin_scraper.js  # Playwright profile & activity scrapers
│   ├── search_engine.js  # LinkedIn post search (Playwright + Tavily fallback)
│   ├── triage_filter.js  # Groq-powered relevance gate
│   ├── ssi_analyzer.js   # DeepSeek SSI strategy analyser
│   ├── seen_store.js     # File-backed deduplication store
│   └── telegram_sender.js  # Telegram Bot API wrapper
├── data/
│   ├── cv.md             # (optional) Local profile fallback
│   └── seen_urls.json    # Auto-generated; tracks processed posts
├── tests/                # Vitest unit tests
├── .env                  # Local credentials (never commit this)
├── .env.example          # Template for required environment variables
└── package.json
```

---

## Running Tests

```bash
npm test
```

Tests are written with [Vitest](https://vitest.dev/) and cover the triage filter, SSI analyser, seen store, and Telegram sender modules.

---

## License

MIT
