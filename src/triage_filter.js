import { GROQ_API_KEY, TRIAGE_MODEL } from './config.js';

export async function eseguiTriagePost(post) {
  if (!GROQ_API_KEY) {
    console.error('[triage] GROQ_API_KEY is not configured');
    return false;
  }

  const systemPrompt = `You are a boolean relevance filter. Respond with only "SI" or "NO".

Return "SI" if the post meets at least one of these criteria:
- Relevant to software engineering (Node.js, Vue, React, JavaScript, TypeScript, Vite, Vitest, or similar)
- Relevant to AI automation workflows (LLMs, RAG, multi-agents, pipelines, AI tools)
- Relevant to career transitions or tech recruitment

Additionally, the post must contain actual discussions, thoughts, or insights. Reject pure advertisements and dry job listings with no substance.

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
    return answer.toUpperCase().includes('SI');
  } catch (err) {
    console.error('[triage] Fetch error:', err.message);
    return false;
  }
}
