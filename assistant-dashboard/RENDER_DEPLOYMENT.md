# Render Deployment Guide

Deploy your Assistant Dashboard to Render in 5 minutes.

## Step 1: GitHub Setup (if not already done)

```bash
cd C:\Users\antoi\.openclaw\workspace\openclaw-fork

# If not on GitHub yet
git remote add origin https://github.com/antoineriley1-debug/openclaw.git
git push -u origin main
```

## Step 2: Create Render Service

1. Go to https://dashboard.render.com
2. Click "New +" → "Web Service"
3. Connect your GitHub account
4. Select repo: `antoineriley1-debug/openclaw`
5. Fill in:
   - **Name**: `assistant-dashboard`
   - **Root Directory**: `assistant-dashboard`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
   - **Instance Type**: Free (or Starter if you need more power)

## Step 3: Add Environment Variables

In Render dashboard, go to Environment:

```
ANTHROPIC_API_KEY = sk-ant-your-key-here
MISTRAL_API_KEY = your-mistral-key
GROQ_API_KEY = your-groq-key
NODE_ENV = production
PORT = 3000
```

**To get keys:**
- **Claude**: https://console.anthropic.com/account/keys
- **Mistral**: https://console.mistral.ai/api-keys
- **Groq**: https://console.groq.com/keys

## Step 4: Deploy

1. Click "Create Web Service"
2. Render auto-deploys from GitHub (watch the logs)
3. Once green ✅, your dashboard is live at:
   - https://assistant-dashboard-xxxxx.onrender.com

## Step 5: Test It

1. Open your Render URL
2. Go to "⚙️ Settings" tab
3. Your API keys should be available from env vars
4. Try executing a task in "📊 Overview" tab

## Auto-Deploy on Push

Every time you push to main:
```bash
git add .
git commit -m "your message"
git push origin main
```

Render auto-rebuilds and deploys within 2-3 minutes. Watch the dashboard logs.

## Troubleshooting

**Build fails?**
```
Check Render logs → View build log → scroll to error
Usually: missing dependency or NODE_ENV issue
```

**Dashboard shows "Online" but can't execute?**
```
1. Check API keys are set in Render env vars
2. Verify they're correct (no extra spaces)
3. Try in browser console: fetch('/api/status')
```

**Can't connect from local?**
```
Your Render URL is public, but CORS might block some requests.
For local testing use http://localhost:3000 instead
```

## Next: Office Integration

Once deployed, you can call it from Office:

```javascript
// Power Automate / Office Automation
const res = await fetch('https://YOUR-RENDER-URL/api/ai/execute', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ prompt: 'analyze this data' })
});
```

---

Need help? Check Render logs or test locally first with `npm run dev`
