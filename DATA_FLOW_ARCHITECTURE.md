# AI Assistant Data Flow Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        STOCK DESK APPLICATION                           │
└─────────────────────────────────────────────────────────────────────────┘

                    ┌──────────────────────────────────────┐
                    │     React Frontend (Vite)            │
                    │     http://127.0.0.1:3000            │
                    └──────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
        ┌──────────────────┐  ┌───────────────┐  ┌──────────────────┐
        │  Dashboard       │  │  Billing      │  │  AI Assistant    │
        │  Inventory       │  │  Khata        │  │  (Chat Widget)   │
        │  Analytics       │  │  Products     │  │                  │
        └──────────────────┘  └───────────────┘  └──────────────────┘
                    │               │               │
                    └───────────────┼───────────────┘
                                    │
                    Sends user data + question
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   App.tsx State Management            │
                    │                                       │
                    │  • products: Product[]               │
                    │  • transactions: Transaction[]       │
                    │  • contacts: Contact[]               │
                    └──────────────────────────────────────┘
                                    │
                    ┌───────────────┼───────────────┐
                    │               │               │
                    ▼               ▼               ▼
        ┌──────────────────┐  ┌───────────────┐  ┌──────────────────┐
        │ Supabase         │  │ Service       │  │ Vite Proxy       │
        │                  │  │ openRouter    │  │                  │
        │ • products       │  │ Service.js    │  │ /api → :3001     │
        │ • transactions   │  │               │  │                  │
        │ • contacts       │  │ • Formats     │  │ Forwards to:     │
        │                  │  │   request     │  │                  │
        │ Database         │  │ • Adds data   │  │ http://          │
        │                  │  │ • Calls API   │  │ localhost:3001   │
        └──────────────────┘  └───────────────┘  └──────────────────┘
                                    │
                                    │ JSON: {
                                    │   userInput: string
                                    │   products: Product[]
                                    │   transactions: Transaction[]
                                    │   contacts: Contact[]
                                    │ }
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   Express Proxy Server (Node.js)     │
                    │   http://localhost:3001              │
                    │   /api/openrouter (POST)             │
                    └──────────────────────────────────────┘
                                    │
                                    │ Enhanced Request:
                                    │ • System Prompt (detailed instructions)
                                    │ • User Input
                                    │ • Complete Business Data
                                    │ • Formatting Guidelines
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   OpenRouter API                     │
                    │   https://openrouter.ai/api/v1/...   │
                    │                                      │
                    │  Model: meta-llama/llama-2-7b-chat   │
                    └──────────────────────────────────────┘
                                    │
                                    │ AI Processing:
                                    │ 1. Read system prompt
                                    │ 2. Analyze business data
                                    │ 3. Process user question
                                    │ 4. Generate insight
                                    │ 5. Format with markdown
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   AI Response                        │
                    │                                      │
                    │ ## Top Selling Products              │
                    │ • Product A: **150 units**           │
                    │ • Product B: **120 units**           │
                    │                                      │
                    │ **Total Profit: Rs 45,000**          │
                    └──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   Express Server Proxy               │
                    │   (Processes Response)               │
                    │                                      │
                    │ Returns: {                           │
                    │   text: string (AI response)         │
                    │   raw: object (full API response)    │
                    │ }                                    │
                    └──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   React Frontend (openRouter        │
                    │   Service receives response)         │
                    │                                      │
                    │ Extracts: response.data.text         │
                    └──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   AiAssistant Component              │
                    │   Displays in Chat Widget            │
                    │                                      │
                    │   • Renders formatted response       │
                    │   • Shows as AI message              │
                    │   • User can read insights           │
                    │   • Can ask follow-up questions      │
                    └──────────────────────────────────────┘
                                    │
                                    ▼
                    ┌──────────────────────────────────────┐
                    │   User Sees Formatted Response       │
                    │                                      │
                    │   ┌────────────────────────────────┐ │
                    │   │ ## Top Selling Products         │ │
                    │   │ • Product A: **150 units**      │ │
                    │   │ • Product B: **120 units**      │ │
                    │   │                                │ │
                    │   │ **Total Profit: Rs 45,000**    │ │
                    │   └────────────────────────────────┘ │
                    └──────────────────────────────────────┘
```

---

## Data Flow Steps

### Step 1: User Input
```
User: "What should I restock?"
↓
Frontend collects:
• userInput: "What should I restock?"
• products: [all products with quantities]
• transactions: [all transactions]
• contacts: [all customers/suppliers]
```

### Step 2: Service Call
```
openRouterService.js calls:
fetch('/api/openrouter', {
  body: { userInput, products, transactions, contacts }
})
↓
Vite Proxy forwards to http://localhost:3001
```

### Step 3: Server Processing
```
server/index.js receives request:
• Validates API key ✓
• Prepares system prompt with:
  - Instructions & rules
  - Data schema
  - Formatting guidelines
  - Sample responses
• Includes all business data (sliced to limit tokens)
• Creates OpenRouter request
```

### Step 4: AI Processing
```
OpenRouter API processes:
• Receives: { system_prompt, user_message, model }
• Analyzes: business data + question
• Generates: tailored response
• Returns: structured JSON response
```

### Step 5: Response Formatting
```
Server receives OpenRouter response:
• Extracts: response.choices[0].message.content
• Validates: response status (200)
• Returns: { text: "AI response", raw: {...} }
```

### Step 6: Frontend Display
```
AiAssistant Component:
• Receives: response.data.text
• Displays: in chat widget
• Formats: markdown rendering (**, •, ##, etc.)
• Shows: to user in chat interface
```

---

## Data Types

### Product Data Sent
```javascript
{
  sku: string,
  user_id: string,
  name: string,
  costPrice: number,
  price: number,
  quantity: number,
  lowStockThreshold: number
}
```

### Transaction Data Sent
```javascript
{
  id: number,
  user_id: string,
  timestamp: Date,
  items: [
    {
      productSku: string,
      name: string,
      quantitySold: number,
      pricePerItem: number
    }
  ],
  subtotal: number,
  discountPercent: number,
  total: number
}
```

### Contact Data Sent
```javascript
{
  id: string,
  user_id: string,
  name: string,
  phone_number?: string,
  contact_type: 'customer' | 'supplier',
  current_balance: number,
  created_at: Date
}
```

---

## System Prompt Structure

```
ROLE DEFINITION
↓
YOUR ROLE: You are an expert business analyst...

DATA PROVIDED
↓
Products (X items), Transactions (Y records), Contacts (Z records)

FORMATTING GUIDELINES
↓
• Use **bold** for emphasis
• Use • for bullet points
• Use ## for headers
• DON'T use ***
• Use markdown format

ANALYSIS RULES
↓
• Calculate metrics
• Identify trends
• Flag important issues
• Base answers on data only
• Be concise and clear

SCHEMA DEFINITION
↓
Product: { id, name, sku, quantity, costPrice, ... }
Transaction: { id, created_at, amount, discount_percentage }
TransactionItem: { id, transaction_id, product_id, ... }
Contact: { id, name, type, balance }

USER DATA (SLICED)
↓
Products (max 30 items shown)
Transactions (max 15 records shown)
Contacts (max 20 records shown)

USER QUESTION
↓
"What should I restock?"
```

---

## Token Management

To prevent hitting OpenRouter token limits:

```javascript
// Only send first 50 products
products.slice(0, 50)

// Only send first 50 transactions
transactions.slice(0, 50)

// Only send first 100 transaction items
transactionItems.slice(0, 100)

// Only send first 50 contacts
contacts.slice(0, 50)

// Result: Typically ~2000-4000 tokens per request
// Leaves room for response (~500-1000 tokens)
```

---

## Error Handling Flow

```
User Question
    ↓
openRouterService call
    ↓
Network Error? → Return: "Couldn't connect to AI service"
    ↓
Proxy returns 500? → Return: "Temporary issue with AI service"
    ↓
API Error? → Return: "Error processing your request"
    ↓
Success (200) → Extract response.data.text
    ↓
Display in Chat
```

---

## Performance Considerations

1. **Data Slicing**: Limits tokens sent
2. **Async Requests**: Non-blocking UI
3. **Error Boundaries**: Graceful failure
4. **Rate Limiting**: 30 requests/min per IP (via express-rate-limit)
5. **JSON Size**: Max 500KB per request

---

## Security Flow

```
User Input
    ↓
Sanitized (no code execution)
    ↓
API Key Hidden (server-side only)
    ↓
HTTPS to OpenRouter
    ↓
Response Sanitized
    ↓
Displayed as Plain Text (no XSS)
```

---

**Architecture Complete!** ✅  
All components integrated and data flowing correctly.
