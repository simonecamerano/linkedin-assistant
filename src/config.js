import dotenv from 'dotenv';
dotenv.config();

export const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
export const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID?.trim() || '';
export const TAVILY_API_KEY = process.env.TAVILY_API_KEY;
export const GROQ_API_KEY = process.env.GROQ_API_KEY;
export const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;
export const LINKEDIN_LI_AT = process.env.LINKEDIN_LI_AT;
export const LINKEDIN_PROFILE_URL = process.env.LINKEDIN_PROFILE_URL;
export const TRIAGE_MODEL = process.env.TRIAGE_MODEL;
export const ANALYSIS_MODEL = process.env.ANALYSIS_MODEL;
export const MIN_MATCH_SCORE = parseInt(process.env.MIN_MATCH_SCORE || '70', 10);
