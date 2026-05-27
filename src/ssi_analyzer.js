/**
 * @module ssi_analyzer
 * Deep analysis layer that pairs a LinkedIn post with the user's profile to
 * produce a strategic SSI (Social Selling Index) report.
 *
 * Uses the DeepSeek API for higher-quality, nuanced output compared to the
 * triage step.  The report is formatted in Telegram-compatible HTML markdown
 * and includes a relevance score, a strategic engagement angle, and a
 * ready-to-paste comment draft.
 */

import { DEEPSEEK_API_KEY, ANALYSIS_MODEL } from './config.js';

/**
 * Analyses a LinkedIn post in the context of the user's profile and generates
 * a structured SSI strategy report.
 *
 * The report always follows a fixed three-section structure so that the
 * caller can reliably parse the PERTINENZA score with a regex.
 *
 * @param {{ title: string, url: string, content: string }} post - The post to analyse.
 * @param {string} profileText - Plain-text summary of the user's LinkedIn profile (from scraper or cv.md).
 * @returns {Promise<string>} A Telegram-formatted markdown string containing the SSI report,
 *   or an error message string if the API call fails.
 */
export async function analizzaPostPerSSI(post, profileText) {
  if (!DEEPSEEK_API_KEY) {
    console.error('[ssi] DEEPSEEK_API_KEY is not configured');
    return 'Error: DEEPSEEK_API_KEY is not configured.';
  }

  // The system prompt locks the model into a rigid three-section output format.
  // This is intentional: index.js uses a regex on "PERTINENZA" to extract the
  // numeric score, so any deviation in structure would silently break scoring.
  const systemPrompt = `Sei un Senior LinkedIn Branding Strategist specializzato nell'ottimizzazione del Social Selling Index (SSI) e nel personal branding professionale.

Il tuo compito è analizzare post LinkedIn e produrre un report strategico in italiano, formattato per Telegram (markdown con **grassetto** per i titoli, testo conciso, senza muri di testo).

Rispondi SEMPRE con esattamente questa struttura:

🎯 **PERTINENZA**: [Percentuale di corrispondenza e breve giustificazione basata sul background dell'utente]

📈 **ANGOLO STRATEGICO (SSI)**: [Strategia su come l'utente può commentare collegando il post al suo doppio background: 26 anni di leadership nella GDO + sviluppo AI/Full Stack]

📝 **BOZZA COMMENTO**: [Un commento professionale e naturale in italiano, pronto da copiare e incollare. Nessun segnaposto.]`;

  // Combine the user's profile context with the post content in a single user
  // message, giving the model everything it needs in one request.
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
        // temperature: 0.7 allows creative comment drafts while keeping
        // the structural sections stable.
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
