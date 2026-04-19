# Quick Start — No Keys Needed Yet

Your dashboard is ready to deploy. **Keys can be added later through the UI.**

## Deploy to Render (1 click)

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Select repo: `antoineriley1-debug/openclaw`
4. Configure:
   - **Name:** assistant-dashboard
   - **Root Directory:** assistant-dashboard
   - **Build Command:** npm install && npm run build
   - **Start Command:** npm start
   - **Environment:** Leave blank for now (add keys later in UI)
5. Click **"Create Web Service"**

Render deploys automatically. Takes ~3 min.

## Once Live

1. Open your Render URL (e.g., https://assistant-dashboard-xyz.onrender.com)
2. Go to **⚙️ Settings** tab
3. Add your API keys:
   - Anthropic (Claude)
   - Mistral
   - Groq
4. Keys are encrypted and stored locally in the dashboard

## Test Locally First (Optional)

```bash
cd assistant-dashboard
npm run dev
# Open http://localhost:5173
```

---

**That's it.** Dashboard is live. Keys come next.
