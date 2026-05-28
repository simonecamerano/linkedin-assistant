# Architecture

This document provides a structured overview of the project's source modules.

## TypeScript / JavaScript Modules

### [bot.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/bot.js)
- **Exports:** *none*
- **Functions:** `sendMessage`, `runScript`, `poll`
- **Imports from:** `child_process`, `fs`, `./src/config.js`

### [index.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/index.js)
- **Exports:** *none*
- **Functions:** `runLinkedinAssistant`
- **Imports from:** `./src/linkedin_scraper.js`, `./src/search_engine.js`, `./src/triage_filter.js`, `./src/ssi_analyzer.js`, `./src/seen_store.js`, `./src/telegram_sender.js`, `./src/config.js`, `./src/query_generator.js`

### [src/config.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/config.js)
- **Exports:** `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID`, `TAVILY_API_KEY`, `GROQ_API_KEY`, `DEEPSEEK_API_KEY`, `LINKEDIN_LI_AT`, `LINKEDIN_PROFILE_URL`, `TRIAGE_MODEL`, `ANALYSIS_MODEL`, `MIN_MATCH_SCORE`
- **Imports from:** `dotenv`

### [src/linkedin_scraper.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/linkedin_scraper.js)
- **Exports:** `scrapeUserProfile`, `scrapeUserActivity`
- **Functions:** `scrapeUserProfile`, `scrapeUserActivity`
- **Imports from:** `playwright`, `fs`, `path`, `./config.js`

### [src/query_generator.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/query_generator.js)
- **Exports:** `generateDynamicQueries`
- **Functions:** `generateDynamicQueries`
- **Imports from:** `./config.js`

### [src/search_engine.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/search_engine.js)
- **Exports:** `searchLinkedInPosts`
- **Functions:** `searchLinkedInPosts`
- **Imports from:** `@tavily/core`, `playwright`, `./config.js`

### [src/seen_store.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/seen_store.js)
- **Exports:** `loadSeen`, `saveSeen`
- **Functions:** `loadSeen`, `saveSeen`
- **Imports from:** `fs`, `path`

### [src/ssi_analyzer.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/ssi_analyzer.js)
- **Exports:** `analizzaPostPerSSI`
- **Functions:** `analizzaPostPerSSI`
- **Imports from:** `./config.js`

### [src/telegram_sender.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/telegram_sender.js)
- **Exports:** `convertiMarkdownInHtml`, `inviaATelegram`
- **Functions:** `convertiMarkdownInHtml`, `inviaATelegram`
- **Imports from:** `./config.js`

### [src/triage_filter.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/src/triage_filter.js)
- **Exports:** `eseguiTriagePost`
- **Functions:** `eseguiTriagePost`
- **Imports from:** `./config.js`

### [tests/search_and_scrape.test.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/tests/search_and_scrape.test.js)
- **Exports:** *none*
- **Imports from:** `vitest`, `fs`, `../src/linkedin_scraper.js`, `../src/search_engine.js`, `playwright`, `@tavily/core`

### [tests/setup.test.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/tests/setup.test.js)
- **Exports:** *none*
- **Imports from:** `vitest`, `fs`, `path`, `../src/config.js`, `../src/seen_store.js`

### [tests/triage_and_analysis.test.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/tests/triage_and_analysis.test.js)
- **Exports:** *none*
- **Imports from:** `vitest`, `../src/triage_filter.js`, `../src/ssi_analyzer.js`

### [vitest.config.js](file:///home/simone/Documenti/start2impact/Progetti personali/linkedin-assistent/vitest.config.js)
- **Exports:** *none*
- **Imports from:** `vitest/config`

