// api/openrouter.js
export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured' });

  const { userInput, products, transactions } = req.body || {};

  const systemPrompt = `You are a helpful pharmacy inventory assistant for an app called 'Stock Desk'.\n\nProduct Inventory Data:\n${JSON.stringify(products || [], null, 2)}\n\nRecent Transactions Data:\n${JSON.stringify(transactions || [], null, 2)}\n\nProvide clear, concise, and actionable advice directly to the user.`;

  try {
    const orBody = {
      model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput || '' }
      ]
    };

    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orBody),
    });

    const text = await r.text();
    let data;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!r.ok) {
      return res.status(r.status).json({ error: data });
    }

    // Return the parsed response so client can use it
    return res.status(200).json({ text: data?.choices?.[0]?.message?.content ?? null, raw: data });
  } catch (err) {
    console.error('openrouter function error:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
}
