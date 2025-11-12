# AI Assistant - Quick Troubleshooting Guide

## ✅ Verification Checklist

### Running Application
- [ ] Both servers show "ready" in terminal
  - Vite: "VITE ready in XXX ms"
  - Express: "OpenRouter proxy listening on http://localhost:3001"
- [ ] No error messages in console
- [ ] API Key shows as configured: "✓ OPENROUTER_API_KEY is configured"

### Data Requirements
- [ ] You have at least 1 product added in the system
- [ ] You have made at least 1 transaction/sale
- [ ] Optional: You have contacts (customers/suppliers) in Khata

### Testing
- [ ] Click AI Assistant button (blue circle, bottom-right)
- [ ] Chat window opens
- [ ] You can type and send messages
- [ ] AI responds within 30 seconds

---

## ❌ Common Issues & Solutions

### Issue 1: "Cannot GET /api/openrouter"

**Problem**: Express server not running or proxy misconfigured

**Solutions**:
```bash
# Option 1: Check if servers are running
# Should see BOTH:
# [0] VITE ready
# [1] OpenRouter proxy listening

# Option 2: Restart dev server
npm run dev

# Option 3: Run servers separately
# Terminal 1:
npm run dev:vite

# Terminal 2:
npm run dev:server
```

---

### Issue 2: "Proxy error 500"

**Problem**: OpenRouter API key not configured or API error

**Solutions**:
1. **Check API Key**
   ```bash
   cat server/.env.local
   # Should show: OPENROUTER_API_KEY=sk-or-v1-...
   ```

2. **Verify Key Format**
   ```
   ✓ Correct:    sk-or-v1-939cb98c391b89c8f668c36f869252ba...
   ❌ Wrong:      just the hash part without "sk-or-v1-"
   ❌ Wrong:      OPENROUTER_API_KEY=<blank or undefined>
   ```

3. **Restart Server**
   ```bash
   # Kill all node processes
   powershell -Command "Get-Process node -ErrorAction SilentlyContinue | Stop-Process -Force"
   
   # Restart
   npm run dev
   ```

---

### Issue 3: "Empty Response" or "No response from AI service"

**Problem**: AI responded but response format is wrong

**Debug Steps**:
1. Open browser DevTools (F12)
2. Go to Network tab
3. Send a question to AI Assistant
4. Look for POST to `/api/openrouter`
5. Check Response tab - should show JSON like:
   ```json
   {
     "text": "Your AI response here...",
     "raw": { "choices": [...] }
   }
   ```

---

### Issue 4: "Port 3001 already in use"

**Problem**: Another process using the port

**Solutions**:
```bash
# Option 1: Kill all Node processes
powershell -Command "Get-Process node | Stop-Process -Force"

# Option 2: Find process on port 3001 and kill it
# Windows:
netstat -ano | findstr :3001
taskkill /PID <PID> /F

# Option 3: Change port in .env.local
# server/.env.local:
PORT=3002  # Change from 3001 to 3002

# Then update vite.config.ts:
target: 'http://localhost:3002'
```

---

### Issue 5: AI Responses Are Generic/Not Using Data

**Problem**: Data not being sent or AI ignoring it

**Debug**:
1. Open DevTools Console
2. Check for errors
3. Look at Network request body - should include products, transactions, contacts
4. Verify you have data in the database:
   - Go to Inventory screen - any products?
   - Go to Billing screen - any transactions?
   - Go to Khata screen - any contacts?

**Solution**:
- Add test data first (product + transaction)
- Then ask about that data

---

### Issue 6: Formatting Issues (`***` appears as literal text)

**Problem**: Using `***` for formatting instead of `**`

**Wrong**:
```
***This is important***
```

**Right**:
```
**This is important**
```

See `FORMATTING_GUIDE.md` for complete guide.

---

### Issue 7: Chat Widget Doesn't Open

**Problem**: JavaScript error or component not rendering

**Debug**:
1. Open DevTools (F12)
2. Check Console tab for errors
3. Check if AiAssistant component is receiving data

**Try**:
```javascript
// In browser console:
console.log(document.querySelector('[aria-label="Toggle AI Assistant"]'))
// Should show the button element

// Click it
document.querySelector('[aria-label="Toggle AI Assistant"]').click()
```

---

### Issue 8: Slow Responses

**Problem**: Normal - LLM processing takes time

**Expected Times**:
- First response: 5-15 seconds (model loading)
- Subsequent: 2-5 seconds
- Network latency: +1-2 seconds

**If taking >30 seconds**:
- Check internet connection
- Check OpenRouter status
- Reduce data size (fewer products/transactions)

---

## 🔍 Detailed Debugging

### Enable Verbose Logging

**Frontend (in AiAssistant.tsx)**:
```typescript
console.log('Sending to AI:', { userInput, products, transactions, contacts });
```

**Server (in server/index.js)**:
```javascript
console.log('Received request:', req.body);
console.log('System prompt length:', systemPrompt.length);
```

### Check Each Component

**1. Service Function**
```javascript
// services/openRouterService.js
console.log('Calling /api/openrouter with:', { userInput, products, transactions, contacts });
```

**2. API Endpoint**
```javascript
// server/index.js
app.post('/api/openrouter', async (req, res) => {
  console.log('Request received');
  console.log('Has API key:', !!OPENROUTER_KEY);
  console.log('Products count:', req.body.products?.length || 0);
  // ...
});
```

**3. Network Traffic**
- DevTools → Network tab
- Filter: XHR/Fetch
- Find `/api/openrouter` requests
- Check: Status, Response, Headers

---

## 🚀 Advanced Troubleshooting

### Check Environment Variables

```bash
# In server/index.js, add:
console.log('Loaded from .env.local:');
console.log('API Key:', process.env.OPENROUTER_API_KEY ? 'SET ✓' : 'MISSING ❌');
console.log('Model:', process.env.OPENROUTER_MODEL);
console.log('Port:', process.env.PORT);
```

### Test API Directly

```bash
# Test OpenRouter API directly (replace YOUR_KEY)
curl -X POST https://openrouter.ai/api/v1/chat/completions \
  -H "Authorization: Bearer YOUR_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "model": "meta-llama/llama-2-7b-chat:free",
    "messages": [
      {"role": "user", "content": "Hello"}
    ]
  }'
```

### Test Proxy Server

```bash
# With server running on :3001
curl -X POST http://localhost:3001/api/openrouter \
  -H "Content-Type: application/json" \
  -d '{
    "userInput": "Test",
    "products": [],
    "transactions": [],
    "contacts": []
  }'
```

---

## 📊 Performance Optimization

### If Responses Are Slow

1. **Reduce data size** in `server/index.js`:
   ```javascript
   products.slice(0, 20)    // Was 50
   transactions.slice(0, 10) // Was 50
   contacts.slice(0, 10)     // Was 50
   ```

2. **Simplify system prompt**:
   - Reduce example responses
   - Remove detailed schema

3. **Use faster model** (if available):
   ```
   openrouter.ai/models - check available free models
   ```

---

## ✅ Success Indicators

### Working Setup Should Show:

```
Terminal Output:
[1] ✓ OPENROUTER_API_KEY is configured
[1] ✓ Using model: meta-llama/llama-2-7b-chat:free
[1] OpenRouter proxy listening on http://localhost:3001
[0] ➜ Local: http://127.0.0.1:3000/

Browser:
- AI button visible at bottom-right ✓
- Can click to open chat ✓
- Can type message ✓
- Can send message ✓
- AI responds with data-aware insights ✓
- Response uses proper formatting (**bold**, •, ##) ✓
```

---

## 🆘 Still Having Issues?

**Check This Checklist**:
- [ ] Both servers running (Vite + Express)
- [ ] API key present in `server/.env.local`
- [ ] .env.local has correct format (no spaces after =)
- [ ] You have data in the database
- [ ] No error messages in console
- [ ] Tried hard refresh (Ctrl+Shift+R)
- [ ] Tried restarting dev server
- [ ] Checked browser console for errors

**If Still Stuck**:
1. Share terminal output
2. Share DevTools network request/response
3. Share browser console errors
4. Confirm API key is valid (test directly with OpenRouter)

---

**Last Updated**: November 12, 2025  
**Status**: ✅ All systems integrated and ready
