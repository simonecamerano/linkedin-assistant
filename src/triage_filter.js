/**
 * @module triage_filter
 * First-pass relevance gate for LinkedIn posts.
 *
 * Sends each post to a fast, cheap LLM (Groq) with a strict boolean prompt.
 * Only posts that pass this filter are forwarded to the more expensive
 * DeepSeek SSI analysis step, keeping API costs low.
 */

import { GROQ_API_KEY, TRIAGE_MODEL } from './config.js';

/**
 * Runs a lightweight LLM triage check on a single LinkedIn post to determine
 * whether it is worth a full SSI analysis.
 *
 * The model is instructed to respond with only "SI" or "NO", and
 * `max_tokens: 5` enforces that constraint at the API level to minimise cost
 * and latency.  `temperature: 0` ensures deterministic, reproducible results.
 *
 * @param {{ title: string, url: string, content: string }} post - The post to evaluate.
 * @returns {Promise<boolean>} `true` if the post passes the relevance filter, `false` otherwise.
 */
export async function eseguiTriagePost(post, profileContext = '') {
  if (!GROQ_API_KEY) {
    console.error('[triage] GROQ_API_KEY is not configured');
    return false;
  }

  const profileSection = profileContext
    ? `\n\nUSER CONTEXT:\n${profileContext}\n\nUse the user context above to judge whether this post is relevant to their specific tech stack, projects, GDO leadership background, and latest activity.`
    : '';

  const systemPrompt = `You are a boolean relevance filter. Respond with only "SI" or "NO".${profileSection}

Return "SI" only if the post meets ALL of these constraints:
- The post is written in Italian.
- The post contains actual discussions, thoughts, or insights — not pure advertisements or dry job listings with no substance.
- The post is relevant to the user's profile and fields of interest (tech stack, projects, career trajectory, or adjacent topics where their background adds value).

Return "NO" for everything else.`;

  const userMessage = `Title: ${post.title}\nURL: ${post.url}\n\nContent:\n${post.content}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        // Limit tokens to a single word — the model only needs to say "SI" or "NO".
        max_tokens: 5,
        temperature: 0,
      }),
    });

    if (!response.ok) {
      console.error(`[triage] Groq API error: ${response.status} ${response.statusText}`);
      return false;
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim() ?? '';
    // Accept any response that contains "SI" (case-insensitive), so minor
    // model deviations like "Si." or "SI!" still pass.
    return answer.toUpperCase().includes('SI');
  } catch (err) {
    console.error('[triage] Fetch error:', err.message);
    return false;
  }
}
