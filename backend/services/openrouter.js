const DEFAULT_MODEL = 'anthropic/claude-haiku-4.5';

async function callOpenRouter(prompt, systemPrompt = 'You are a helpful AI assistant specializing in trademark and brand protection.') {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new Error('OPENROUTER_API_KEY is not configured');

  const baseUrl = process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1';
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': 'https://trademark-monitor.app',
      'X-Title': 'AI Trademark Monitor'
    },
    body: JSON.stringify({
      model: process.env.OPENROUTER_MODEL || DEFAULT_MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errorBody = await response.text();
    throw new Error(`OpenRouter API error (${response.status}): ${errorBody}`);
  }

  const data = await response.json();
  if (!data.choices || data.choices.length === 0) throw new Error('No response from OpenRouter API');
  return data.choices[0].message.content;
}

function parseAIJson(raw) {
  if (!raw) return null;
  try { return JSON.parse(raw); } catch (_) {}
  try {
    const stripped = raw.replace(/```json?\s*/gi, '').replace(/```/g, '').trim();
    return JSON.parse(stripped);
  } catch (_) {}
  const match = raw.match(/\{[\s\S]*\}/);
  if (match) { try { return JSON.parse(match[0]); } catch (_) {} }
  return null;
}

module.exports = { callOpenRouter, parseAIJson };
