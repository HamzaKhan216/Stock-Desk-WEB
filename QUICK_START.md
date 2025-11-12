# 🚀 Quick Start Guide - AI Assistant Integration

## ⚡ Get Started in 30 Seconds

### 1. **Start the Application**
```bash
npm run dev
```

Expected output:
```
✓ OPENROUTER_API_KEY is configured
✓ Using model: meta-llama/llama-2-7b-chat:free
OpenRouter proxy listening on http://localhost:3001

VITE ready in XXX ms
➜ Local: http://127.0.0.1:3000/
```

### 2. **Open Browser**
- Go to `http://127.0.0.1:3000/`
- Log in to Stock Desk

### 3. **Add Test Data**
- Go to **Inventory** → Add a product
- Go to **Billing** → Add items to cart → Checkout
- Go to **Khata** → Add a contact (optional)

### 4. **Try the AI**
- Click the **AI Assistant button** (blue circle, bottom-right)
- Type: "What should I restock?"
- Click Send

### 5. **Get Tailored Answers**
```
AI: Based on your inventory:
• Product A - Current stock: 5 units (below threshold of 10)
• Product B - Current stock: 2 units (critically low)

I recommend restocking Product B immediately.
```

✅ **Done!** You now have a data-aware AI assistant!

---

## 💡 Example Questions to Try

| Question | Response Type |
|----------|---------------|
| "What should I restock?" | Low stock items |
| "What's my profit?" | Financial metrics |
| "Who owes me money?" | Contact balances |
| "Which products are selling best?" | Top sellers |
| "How much inventory do I have?" | Stock summary |
| "What was my revenue today?" | Daily metrics |
| "Which customers haven't paid?" | Overdue receivables |

---

## ❌ What If It Doesn't Work?

### Issue: "Proxy error 500"
**Fix**: Check API key in `server/.env.local`
```bash
cat server/.env.local
# Should show: OPENROUTER_API_KEY=sk-or-v1-...
```

### Issue: "Port already in use"
**Fix**: Kill old processes
```bash
powershell -Command "Get-Process node | Stop-Process -Force"
npm run dev
```

### Issue: Generic/empty responses
**Fix**: Make sure you have data
- Add products first
- Make at least one transaction
- Then ask about it

### Issue: Formatting looks wrong (`***` appears)
**Fix**: Don't use `***` for formatting!
- ❌ `***Bold***` 
- ✅ `**Bold**`

See `FORMATTING_GUIDE.md` for details.

---

## 📚 Documentation Files

| File | Purpose |
|------|---------|
| `FORMATTING_GUIDE.md` | Why `***` doesn't work + alternatives |
| `AI_INTEGRATION_COMPLETE.md` | Full integration summary |
| `DATA_FLOW_ARCHITECTURE.md` | System architecture & data flow |
| `TROUBLESHOOTING.md` | Detailed debugging guide |
| `INTEGRATION_SUMMARY.md` | What changed in the code |

---

## 🎯 What's Different Now?

### Before
- AI gave generic responses
- Didn't use your actual data
- Limited to pre-written answers

### After
- AI gives tailored responses based on YOUR data
- Uses your products, transactions, and contacts
- Provides specific, actionable insights
- Proper formatting and structure

---

## 🔧 How It Works (Simple Version)

```
You: "What's my profit?"
    ↓
App collects: products, transactions, contacts
    ↓
Server: sends to OpenRouter with your data
    ↓
AI: analyzes your data → generates insight
    ↓
You: get personalized answer with your numbers
```

---

## 🎓 Key Points

✅ **Data-Driven**: Uses your actual business data  
✅ **Secure**: API key stays on server (never in browser)  
✅ **Fast**: Optimized prompts prevent timeout  
✅ **Formatted**: Uses **bold**, •, ## (NOT ***)  
✅ **Tailored**: Responses specific to YOUR business  

---

## ⚙️ How to Configure (if needed)

### Change AI Model
Edit `server/.env.local`:
```bash
OPENROUTER_MODEL=meta-llama/llama-2-7b-chat:free
```

Available free models: Check [openrouter.ai/models](https://openrouter.ai/models)

### Change Server Port
Edit `server/.env.local`:
```bash
PORT=3002  # instead of 3001
```

Then update `vite.config.ts`:
```typescript
target: 'http://localhost:3002'
```

### More Data Points
Edit `server/index.js` - increase slice limits:
```javascript
products.slice(0, 100)    // was 30
transactions.slice(0, 50) // was 15
contacts.slice(0, 50)     // was 20
```

---

## 🧪 Test the Integration

### Quick Test Script
```javascript
// Open browser console (F12) and run:

// 1. Check if service exists
console.log(typeof getOpenRouterInsight) // should be 'function'

// 2. Manually call service
getOpenRouterInsight(
  'What should I restock?',
  [/* products */],
  [/* transactions */],
  [/* contacts */]
).then(response => console.log(response))

// 3. Check network requests
// Go to Network tab, ask AI question, look for /api/openrouter
```

---

## 📞 Support Resources

### If Something Breaks:

1. **Check console errors** (F12 → Console)
2. **Check network requests** (F12 → Network)
3. **Review terminal output** (npm run dev)
4. **Read TROUBLESHOOTING.md** (comprehensive guide)
5. **Verify API key** (server/.env.local)

### Common Solutions:
- Restart dev server: `npm run dev`
- Kill old processes: `Get-Process node | Stop-Process -Force`
- Check API key is valid
- Ensure you have test data
- Use proper markdown formatting

---

## 🚀 Next Steps (Optional)

### Want More Features?
1. **Conversation History**: Save chats to database
2. **Export Reports**: Download AI insights as PDF
3. **Custom Prompts**: Create industry-specific AI behavior
4. **Voice Support**: Convert responses to speech
5. **Real-time Updates**: WebSocket for live data

### Want to Learn More?
- Read `DATA_FLOW_ARCHITECTURE.md` for system design
- Check `INTEGRATION_SUMMARY.md` for code changes
- Review `server/index.js` for prompt engineering

---

## ✅ Checklist Before Going Live

- [ ] Test with real data (3+ products, 2+ transactions)
- [ ] Try various questions and confirm answers are accurate
- [ ] Check formatting is correct (**bold**, not ***)
- [ ] Verify no errors in browser console
- [ ] Verify both servers running (Vite + Express)
- [ ] Test on actual device/network if needed
- [ ] Backup your work (git commit)

---

## 🎉 You're All Set!

Your AI Assistant is now:
- ✅ Connected to your data
- ✅ Providing tailored insights
- ✅ Using proper formatting
- ✅ Ready for production use

**Enjoy! Questions? Check the documentation files!**

---

**Status**: ✅ READY FOR USE  
**Last Updated**: November 12, 2025  
**Integration Time**: ~2 hours  
**Difficulty**: Intermediate  
**Result**: Full AI integration with business data 🚀
