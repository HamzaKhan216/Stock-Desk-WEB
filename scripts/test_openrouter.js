const fs = require('fs');
const path = require('path');

(async () => {
  try {
    const envPath = path.join(__dirname, '..', '.env.local');
    const env = fs.readFileSync(envPath, 'utf8');
    const m = env.match(/^VITE_OPENROUTER_API_KEY=(.*)$/m);
    const apiKey = m ? m[1].trim() : undefined;
    if (!apiKey) return console.log('No VITE_OPENROUTER_API_KEY found in .env.local');

    const systemPrompt = 'You are a test system prompt.';
    const body = {
      model: 'google/gemini-flash-1.5',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: 'Say hello' }
      ]
    };

    // Use global fetch (Node 18+)
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
    });

    console.log('HTTP', res.status, res.statusText);
    const text = await res.text();
    console.log('BODY LENGTH', text.length);
    try {
      console.log('BODY (parsed):', JSON.parse(text));
    } catch (e) {
      console.log('BODY (raw):', text);
    }
  } catch (err) {
    console.error('ERROR', err);
  }
})();