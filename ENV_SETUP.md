# Environment Variables Setup Guide

This project uses environment variables to securely store sensitive API keys, particularly the Google Gemini API key.

## 🔐 Security Notice

**NEVER commit `.env` or `.env.local` files to version control!** These files contain sensitive API keys and are already included in `.gitignore`.

## 📋 Setup Instructions

### For Local Development

1. **Create your local environment file:**
   ```bash
   cp .env.example .env.local
   ```

2. **Get your Gemini API Key:**
   - Visit [Google AI Studio](https://makersuite.google.com/app/apikey)
   - Sign in with your Google account
   - Click "Create API Key"
   - Copy the generated API key

3. **Add your API key to `.env.local`:**
   ```env
   GEMINI_API_KEY=your_actual_api_key_here
   ```

4. **Restart your development server:**
   ```bash
   npm run dev
   ```

### For Vercel Deployment

1. **Go to your Vercel project dashboard**

2. **Navigate to Settings > Environment Variables**

3. **Add a new environment variable:**
   - **Name:** `GEMINI_API_KEY`
   - **Value:** Your Gemini API key
   - **Environment:** Production, Preview, and Development (select all)

4. **Redeploy your application** for the changes to take effect

## 🔍 How It Works

### Local Development
- Vite automatically loads `.env.local` files
- The API key is read by the Vercel Serverless Function at `/api/gemini.js`
- For local dev, the app uses fallback responses (see `src/utils/devMode.js`)

### Production (Vercel)
- Environment variables are set in Vercel dashboard
- The serverless function at `/api/gemini.js` reads `process.env.GEMINI_API_KEY`
- The API key is **never exposed** to the frontend code

## 🛡️ Security Best Practices

1. ✅ **DO:**
   - Use `.env.local` for local development
   - Add environment variables in Vercel dashboard for production
   - Keep `.env.example` as a template (without real keys)
   - Use different API keys for development and production if possible

2. ❌ **DON'T:**
   - Commit `.env` or `.env.local` files
   - Share API keys in chat, email, or documentation
   - Hardcode API keys in source code
   - Use production API keys in local development

## 📁 File Structure

```
project-root/
├── .env.example          # Template file (safe to commit)
├── .env.local            # Your local keys (gitignored)
├── .gitignore            # Ensures .env files are not committed
└── api/
    └── gemini.js         # Serverless function (reads process.env.GEMINI_API_KEY)
```

## 🚨 Troubleshooting

### "API key not found" Error

**Local Development:**
- Make sure `.env.local` exists in the project root
- Verify `GEMINI_API_KEY` is set correctly
- Restart your dev server after creating/modifying `.env.local`

**Vercel Deployment:**
- Check that `GEMINI_API_KEY` is set in Vercel dashboard
- Ensure it's available for the correct environment (Production/Preview/Development)
- Redeploy after adding the environment variable

### API Not Working Locally

- The app is designed to work in local dev mode without the API
- You'll see fallback responses instead of real AI responses
- This is expected behavior - full AI features work after deployment to Vercel

## 📚 Additional Resources

- [Google Gemini API Documentation](https://ai.google.dev/docs)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Vite Environment Variables](https://vitejs.dev/guide/env-and-mode.html)

