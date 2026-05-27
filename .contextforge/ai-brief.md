# AI Brief

This document contains an optimized summary of the project context for LLMs.

## Project Overview
- **Project:** linkedin-assistent
- **Languages:** Markdown, JSON, JavaScript
- **Branch:** main

### Key Dependencies
- `@tavily/core`: `^0.7.3`
- `dotenv`: `^17.4.2`
- `playwright`: `^1.49.0`

### Module Structure
#### TypeScript/JavaScript Modules
- `src/config.js`:
  - **Exports:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TAVILY_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `LINKEDIN_LI_AT`, `LINKEDIN_PROFILE_URL`, `TRIAGE_MODEL`, `ANALYSIS_MODEL`, `MIN_MATCH_SCORE`
- `src/linkedin_scraper.js`:
  - **Exports:** `scrapeUserProfile`, `scrapeUserActivity`
- `src/search_engine.js`:
  - **Exports:** `searchLinkedInPosts`
- `src/seen_store.js`:
  - **Exports:** `loadSeen`, `saveSeen`
- `tests/search_and_scrape.test.js`:
- `tests/setup.test.js`:

### Open Tasks
- [ ] Develop `src/triage_filter.js` (boolean Groq filter based on user profile/CV) *(Phase 3 — AI Triage & SSI Analysis)*
- [ ] Develop `src/ssi_analyzer.js` (DeepSeek analysis and strategic comment generation) *(Phase 3 — AI Triage & SSI Analysis)*
- [ ] Add unit tests for triage and analysis AI *(Phase 3 — AI Triage & SSI Analysis)*
- [ ] Develop `src/telegram_sender.js` to format and send Telegram digests *(Phase 4 — Integration & Telegram Bot)*
- [ ] Create main orchestration pipeline in `index.js` *(Phase 4 — Integration & Telegram Bot)*
- [ ] Create controller `bot.js` for Telegram remote control (/suggest, /profile, /status) *(Phase 4 — Integration & Telegram Bot)*
- [ ] Run integration and end-to-end pipeline validation *(Phase 4 — Integration & Telegram Bot)*

