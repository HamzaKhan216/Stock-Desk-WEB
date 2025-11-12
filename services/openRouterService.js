// src/services/openRouterService.js

/**
 * Gets AI insight from the OpenRouter API with user data context.
 * @param {string} userInput The user's question.
 * @param {import('../types').Product[]} products The list of products.
 * @param {import('../types').Transaction[]} transactions The list of transactions.
 * @param {import('../types').Contact[]} [contacts] The list of contacts.
 * @returns {Promise<string>} The AI-generated response.
 */
export const getOpenRouterInsight = async (userInput, products, transactions, contacts = []) => {
  // Now proxies requests through the local server endpoint (/api/openrouter)
  // The server holds the OpenRouter API key and forwards requests to the OpenRouter API.
  try {
    const response = await fetch('/api/openrouter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userInput, products, transactions, contacts }),
    });

    if (!response.ok) {
      const bodyText = await response.text();
      console.error('Proxy error:', response.status, bodyText);
      try {
        const parsed = JSON.parse(bodyText);
        return parsed.error ? (parsed.error.message || JSON.stringify(parsed.error)) : `Proxy error ${response.status}`;
      } catch (e) {
        return `Proxy error ${response.status}: ${bodyText}`;
      }
    }

    const data = await response.json();
    // server returns { text, raw }
    if (data && data.text) return data.text;
    if (data && data.raw && data.raw.choices && data.raw.choices[0] && data.raw.choices[0].message) {
      return data.raw.choices[0].message.content;
    }
    return "No response from AI service.";
  } catch (error) {
    console.error('Failed to call proxy:', error);
    return "I'm sorry, but I couldn't connect to the AI service. Please check the console for details.";
  }
};