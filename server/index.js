import express from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load .env.local from the server directory
dotenv.config({ path: path.join(__dirname, '.env.local') });

const app = express();
app.use(cors());
app.use(express.json({ limit: '500kb' }));

const limiter = rateLimit({ windowMs: 60 * 1000, max: 30 }); // 30 reqs/min per IP
app.use('/api/', limiter);

const OPENROUTER_KEY = process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY;
const MODEL = process.env.OPENROUTER_MODEL || process.env.VITE_OPENROUTER_MODEL || 'meta-llama/llama-2-7b-chat:free';

if (!OPENROUTER_KEY) {
  console.warn('Warning: OPENROUTER_API_KEY is not set. Set it in .env.local or process env for the proxy to work.');
} else {
  console.log('✓ OPENROUTER_API_KEY is configured');
  console.log(`✓ Using model: ${MODEL}`);
}

app.post('/api/openrouter', async (req, res) => {
  try {
    if (!OPENROUTER_KEY) return res.status(500).json({ error: 'OPENROUTER_API_KEY not configured on server.' });

    const { userInput, products, transactions, contacts } = req.body || {};

    // Create a detailed system prompt with better instructions
    const systemPrompt = `You are an expert business analyst AI assistant for "Stock Desk", a modern inventory management application.

YOUR ROLE:
- Analyze user business data (products, transactions, contacts) to provide actionable insights
- Answer questions accurately based ONLY on the provided data
- Be concise, clear, and business-focused
- Use markdown formatting for better readability

DATA PROVIDED:
${products && products.length > 0 ? `- Products (${products.length} items): inventory status, pricing, stock levels\n` : ''}${transactions && transactions.length > 0 ? `- Transactions (${transactions.length} records): sales history, revenue, discounts\n` : ''}${contacts && contacts.length > 0 ? `- Contacts (${contacts.length} records): customers and suppliers with balance information\n` : ''}
FORMATTING GUIDELINES:
- For lists: Use bullet points (•) or numbered lists (1., 2., etc.)
- For emphasis: Use **bold** for important numbers or insights
- For sections: Use clear headers (##) when needed
- For comparisons: Use tables when appropriate
- For warnings: Highlight critical issues clearly
- DO NOT use *** for formatting (it causes display issues)
- Use - or • for bullet points instead

ANALYSIS RULES:
- Calculate metrics when asked (profit, revenue, average, percentages)
- Identify trends from transaction history
- Flag low-stock items that need restocking
- Summarize customer/supplier relationships and balances
- If asked something not in the data, explicitly state: "This information is not available in your data"
- Never invent or assume data

EXAMPLE RESPONSES:
Q: "What should I restock?"
A: "Based on your inventory, consider restocking these items:
• Product A - Current stock: 5 units (below threshold of 10)
• Product B - Current stock: 2 units (critically low)"

Q: "What's my profit?"
A: "Your current profit is **Rs [amount]**, calculated from [X] transactions with total revenue of **Rs [amount]** and COGS of **Rs [amount]**."

User's Current Data:
${products ? `\n**Products (${products.length} total):**\n${JSON.stringify(products.slice(0, 30), null, 2)}${products.length > 30 ? '\n... and ' + (products.length - 30) + ' more' : ''}` : ''}

${transactions ? `\n**Recent Transactions (${transactions.length} total):**\n${JSON.stringify(transactions.slice(0, 15), null, 2)}${transactions.length > 15 ? '\n... and ' + (transactions.length - 15) + ' more' : ''}` : ''}

${contacts && contacts.length > 0 ? `\n**Contacts (${contacts.length} total):**\n${JSON.stringify(contacts.slice(0, 20), null, 2)}${contacts.length > 20 ? '\n... and ' + (contacts.length - 20) + ' more' : ''}` : ''}
`;

    const orBody = {
      model: MODEL,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userInput || '' },
      ],
    };

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(orBody),
    });

    const text = await response.text();
    let data = null;
    try { data = JSON.parse(text); } catch (e) { data = text; }

    if (!response.ok) {
      return res.status(response.status).json({ error: data });
    }

    const content = data?.choices?.[0]?.message?.content ?? null;
    return res.json({ text: content, raw: data });
  } catch (err) {
    console.error('Proxy error:', err);
    return res.status(500).json({ error: 'Proxy error' });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OpenRouter proxy listening on http://localhost:${PORT}`));
