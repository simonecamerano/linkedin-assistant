import { GROQ_API_KEY, TRIAGE_MODEL } from './config.js';

const FALLBACK_QUERIES = ['sviluppatore Vue.js Node.js', 'automazione AI workflow', 'cambio carriera sviluppatore'];

export async function generateDynamicQueries(profileText, activityItems = []) {
  if (!GROQ_API_KEY) {
    console.warn('[query_generator] GROQ_API_KEY not configured — using fallback queries');
    return FALLBACK_QUERIES;
  }

  const activitySummary = activityItems.length > 0
    ? activityItems.map(i => `[${i.type}] ${i.text}`).join('\n')
    : 'No recent activity available.';

  const userPrompt = `User profile:\n${profileText}\n\nRecent activity:\n${activitySummary}`;

  try {
    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: TRIAGE_MODEL,
        messages: [
          {
            role: 'system',
            content: `You are a LinkedIn search query strategist. Analyze the user's profile and recent activity, then generate EXACTLY 3 distinct search queries in Italian, each 2-4 keywords long, to find recent engaging LinkedIn posts to comment on. Prioritize adjacent tech/workflow topics where a GDO leadership and AI/Full Stack developer background adds value. Avoid topics the user has recently posted about. Output ONLY a valid JSON array of 3 strings. Example: [ "query one", "query two", "query three" ]`,
          },
          {
            role: 'user',
            content: userPrompt,
          },
        ],
      }),
    });

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content?.trim();
    const parsed = JSON.parse(content);

    if (!Array.isArray(parsed)) {
      throw new Error('Response is not an array');
    }

    return parsed;
  } catch (err) {
    console.warn('[query_generator] Failed to generate dynamic queries — using fallback:', err.message);
    return FALLBACK_QUERIES;
  }
}
