# Active Context

## Git Status

- **Current Branch:** `main`

## Recent 10 Commits

- `81400da feat: initialize project structure with context management, model routing rules, and roadmap documentation`

## Active Tasks in Code (TODO / FIXME)

No TODO or FIXME comments found in the code.

## Roadmap

**Progress:** 7/14 tasks completed (50%)

### Phase 1 — Setup & Config
- [x] Initialize `package.json` with dependencies (`playwright`, `@tavily/core`, `dotenv`, `vitest`)
- [x] Set up `.env` and `src/config.js`
- [x] Create `src/seen_store.js` to store processed post URLs
- [x] Add initial configuration tests with Vitest

### Phase 2 — Core Scraper & Search
- [x] Develop `src/linkedin_scraper.js` using Playwright (extract profile and activity with `li_at` cookie)
- [x] Develop `src/search_engine.js` (integrate Tavily search and Playwright search fallback)
- [x] Add unit tests for search and scraping with mock APIs

### Phase 3 — AI Triage & SSI Analysis
- [ ] Develop `src/triage_filter.js` (boolean Groq filter based on user profile/CV)
- [ ] Develop `src/ssi_analyzer.js` (DeepSeek analysis and strategic comment generation)
- [ ] Add unit tests for triage and analysis AI

### Phase 4 — Integration & Telegram Bot
- [ ] Develop `src/telegram_sender.js` to format and send Telegram digests
- [ ] Create main orchestration pipeline in `index.js`
- [ ] Create controller `bot.js` for Telegram remote control (/suggest, /profile, /status)
- [ ] Run integration and end-to-end pipeline validation

