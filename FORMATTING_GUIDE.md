# AI Assistant Formatting Guide

## ✅ Integration Complete!

Your AI Assistant now has access to your full business data:
- **Products** - Inventory, pricing, stock levels
- **Transactions** - Sales history, revenue, discounts
- **Contacts** - Customers and suppliers with balance information

---

## ❌ Why `***` Formatting Doesn't Work

### The Problem
Using `***` for formatting (like `***Important***`) creates display issues in your chat interface because:

1. **Conflicting Markdown Parsing**: The chat component uses `whitespace-pre-wrap`, which treats `***` as literal text instead of markdown
2. **HTML Rendering**: When displayed as plain text, `***` appears as-is rather than creating formatting
3. **Browser Display**: The text renderer in your chat doesn't parse HTML entities or advanced markdown syntax

### What Happens
```
Input:  ***This is important***
Output: ***This is important***  (appears as literal asterisks)
```

---

## ✅ Recommended Formatting (What Works)

### 1. **Bold Text** - Use Double Asterisks
```markdown
**This is bold and works**
```
✅ **This appears bold**

### 2. **Bullet Points** - Use `•` or `-`
```markdown
• Item 1
• Item 2
- Item 3
- Item 4
```
✅ Works:
• Item 1
• Item 2

### 3. **Numbered Lists**
```markdown
1. First item
2. Second item
3. Third item
```
✅ Works:
1. First item
2. Second item

### 4. **Headers** - Use `#` or `##`
```markdown
## Section Title
```
✅ Creates clear visual separation

### 5. **Emphasis** - Use *Single Asterisks* (but won't display as italic)
```markdown
*Important note*
```
⚠️ Note: Italic won't render, but it's readable

### 6. **Line Breaks** - Use Empty Lines
```markdown
First paragraph

Second paragraph
```
✅ Works great for spacing

---

## 📋 Example: Formatted AI Response

### ❌ BAD (Using `***`)
```
***Top Selling Products***
***Product A*** - 150 units sold
***Product B*** - 120 units sold
```

### ✅ GOOD (Using Recommended Format)
```
## Top Selling Products

• **Product A** - 150 units sold
• **Product B** - 120 units sold
```

---

## 🎯 Best Practices for AI Responses

### For Lists
```markdown
**Low Stock Items:**
• Product X - 5 units (threshold: 10)
• Product Y - 2 units (threshold: 8)
```

### For Metrics
```markdown
**Financial Summary:**
• Total Revenue: **Rs 45,000**
• Total Profit: **Rs 12,500**
• Average Transaction: **Rs 1,200**
```

### For Warnings
```markdown
**⚠️ Critical Alert:**
• Product A is out of stock
• Supplier B owes Rs 50,000
```

### For Comparisons
```markdown
**Top 5 Customers:**
1. Customer A - **Rs 25,000** in sales
2. Customer B - **Rs 18,000** in sales
3. Customer C - **Rs 15,000** in sales
```

---

## 🔧 Technical Details

### Why This Works
The chat component uses:
```tsx
<p className="text-sm whitespace-pre-wrap">{msg.text}</p>
```

This preserves:
- ✅ Line breaks
- ✅ Spaces
- ✅ **Bold text** (via `**text**`)
- ✅ Bullet points (•, -, *)
- ✅ Numbers and symbols

This does NOT render:
- ❌ `***` formatting
- ❌ HTML tags
- ❌ Italic formatting
- ❌ Complex markdown

---

## 💡 Quick Reference

| Format | Code | Result |
|--------|------|--------|
| Bold | `**text**` | ✅ Works |
| Italic | `*text*` | ❌ Shows as plain text |
| Triple Asterisk | `***text***` | ❌ Shows as literal `***` |
| Bullet | `• text` | ✅ Works |
| Number | `1. text` | ✅ Works |
| Header | `## text` | ✅ Works |

---

## 🚀 Updated System Prompt

The AI Assistant now uses an enhanced system prompt that:
1. Includes all your business data (products, transactions, contacts)
2. Provides explicit formatting guidelines
3. Generates accurate, data-driven insights
4. Uses proper markdown formatting
5. Limits data to prevent token overload

---

## 📝 Examples of Good Questions

Try asking:
- "What should I restock?"
- "What's my profit this month?"
- "Which customers owe me money?"
- "What are my top 5 selling products?"
- "How much did I earn today?"
- "Who are my best customers?"
- "What's my total inventory value?"

The AI will now provide tailored answers based on YOUR actual data! 🎉
