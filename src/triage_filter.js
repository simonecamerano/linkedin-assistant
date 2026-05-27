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
export async function eseguiTriagePost(post) {
  if (!GROQ_API_KEY) {
    console.error('[triage] GROQ_API_KEY is not configured');
    return false;
  }

  // The system prompt defines three acceptance criteria and one rejection rule.
  // Keeping the criteria explicit in the prompt (rather than embedding them in
  // code) makes them easy to tune without changing application logic.
  const systemPrompt = `You are a boolean relevance filter. Respond with only "SI" or "NO".

Return "SI" if the post meets at least one of these criteria:
- Relevant to software engineering (Node.js, Vue, React, JavaScript, TypeScript, Vite, Vitest, or similar)
- Relevant to AI automation workflows (LLMs, RAG, multi-agents, pipelines, AI tools)
- Relevant to career transitions or tech recruitment

Additionally, the post must satisfy ALL of these constraints:
- The post must be written in Italian.
- The post must contain actual discussions, thoughts, or insights. Reject pure advertisements and dry job listings with no substance.

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
