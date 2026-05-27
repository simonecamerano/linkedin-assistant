import { DEEPSEEK_API_KEY, ANALYSIS_MODEL } from './config.js';

export async function analizzaPostPerSSI(post, profileText) {
  if (!DEEPSEEK_API_KEY) {
    console.error('[ssi] DEEPSEEK_API_KEY is not configured');
    return 'Error: DEEPSEEK_API_KEY is not configured.';
  }

  const systemPrompt = `Sei un Senior LinkedIn Branding Strategist specializzato nell'ottimizzazione del Social Selling Index (SSI) e nel personal branding professionale.

Il tuo compito è analizzare post LinkedIn e produrre un report strategico in italiano, formattato per Telegram (markdown con **grassetto** per i titoli, testo conciso, senza muri di testo).

Rispondi SEMPRE con esattamente questa struttura:

🎯 **PERTINENZA**: [Percentuale di corrispondenza e breve giustificazione basata sul background dell'utente]

📈 **ANGOLO STRATEGICO (SSI)**: [Strategia su come l'utente può commentare collegando il post al suo doppio background: 26 anni di leadership nella GDO + sviluppo AI/Full Stack]

📝 **BOZZA COMMENTO**: [Un commento professionale e naturale in italiano, pronto da copiare e incollare. Nessun segnaposto.]`;

  const userMessage = `PROFILO UTENTE:\n${profileText}\n\n---\n\nPOST DA ANALIZZARE:\nTitolo: ${post.title}\nURL: ${post.url}\n\nContenuto:\n${post.content}`;

  try {
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: ANALYSIS_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[ssi] DeepSeek API error: ${response.status} ${response.statusText}`, errorText);
      return `Error: DeepSeek API returned ${response.status}.`;
    }

    const data = await response.json();
    return data.choices?.[0]?.message?.content?.trim() ?? 'Error: empty response from DeepSeek.';
  } catch (err) {
    console.error('[ssi] Fetch error:', err.message);
    return `Error: ${err.message}`;
  }
}
