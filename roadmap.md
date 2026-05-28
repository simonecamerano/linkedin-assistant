# Roadmap — LinkedIn Assistant Bot

## Phase 1 — Setup & Config
- [x] Initialize `package.json` with dependencies (`playwright`, `@tavily/core`, `dotenv`, `vitest`)
- [x] Set up `.env` and `src/config.js`
- [x] Create `src/seen_store.js` to store processed post URLs
- [x] Add initial configuration tests with Vitest

## Phase 2 — Core Scraper & Search
- [x] Develop `src/linkedin_scraper.js` using Playwright (extract profile and activity with `li_at` cookie)
- [x] Develop `src/search_engine.js` (integrate Tavily search and Playwright search fallback)
- [x] Add unit tests for search and scraping with mock APIs

## Phase 3 — AI Triage & SSI Analysis
- [x] Develop `src/triage_filter.js` (boolean Groq filter based on user profile/CV)
- [x] Develop `src/ssi_analyzer.js` (DeepSeek analysis and strategic comment generation)
- [x] Add unit tests for triage and analysis AI

## Phase 4 — Integration & Telegram Bot
- [x] Develop `src/telegram_sender.js` to format and send Telegram digests
- [x] Create main orchestration pipeline in `index.js`
- [x] Create controller `bot.js` for Telegram remote control (/suggest, /profile, /status)
- [x] Run integration and end-to-end pipeline validation

## Phase 5 — Docker & Deployment
- [x] Configure Docker environment (`Dockerfile`, `docker-compose.yml`, `.dockerignore`)
- [x] Implement GitHub Actions workflow (`.github/workflows/suggest.yml`) for scheduled execution

