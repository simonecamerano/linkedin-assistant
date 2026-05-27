/**
 * @module config
 * Centralises all runtime configuration by reading environment variables
 * loaded by dotenv. Every other module imports from here instead of
 * accessing `process.env` directly, so there is a single source of truth
 * for required credentials and tuning parameters.
 */

import dotenv from 'dotenv';
dotenv.config();

/** Telegram Bot API token issued by @BotFather. */
export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;

/**
 * Telegram chat/user ID that receives messages.
 * Trimmed to remove accidental whitespace that would silently break API calls.
 */
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';

/** Tavily API key used as the fallback search provider when no LinkedIn cookie is available. */
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY;

/** Groq API key used by the fast triage LLM to classify posts. */
export const GROQ_API_KEY = process.env.GROQ_API_KEY;

/** DeepSeek API key used by the deeper SSI analysis LLM. */
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

/**
 * LinkedIn `li_at` session cookie value.
 * When present, enables authenticated Playwright scraping instead of
 * falling back to Tavily or the local cv.md file.
 */
export const LINKEDIN_LI_AT = process.env.LINKEDIN_LI_AT;

/** Full URL of the user's LinkedIn public profile page. */
export const LINKEDIN_PROFILE_URL = process.env.LINKEDIN_PROFILE_URL;

/** Model identifier sent to Groq for the lightweight triage step (e.g. "llama3-8b-8192"). */
export const TRIAGE_MODEL = process.env.TRIAGE_MODEL;

/** Model identifier sent to DeepSeek for the full SSI analysis step (e.g. "deepseek-chat"). */
export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL;

/**
 * Minimum relevance score (0–100) a post must reach after SSI analysis
 * to be included in the Telegram digest.  Defaults to 70 if not set.
 * Parsed as an integer so downstream comparisons work correctly.
 */
export const MIN_MATCH_SCORE = parseInt(process.env.MIN_MATCH_SCORE || '70', 10);
