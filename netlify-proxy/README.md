# Live Design Injector – Gemini Proxy (Netlify)

This folder contains a ready-to-deploy Netlify Functions project that forwards
requests to Google Gemini. Deploying it lets the Chrome extension call Gemini
from a domain that is allowed by your API key restrictions.

## Files

- `netlify/functions/gemini.js` – the serverless function that receives the
  request from the sandbox, validates the optional `x-sandbox-secret` header,
  forwards the body to the Gemini API, and streams the JSON response back.
- `netlify.toml` – points Netlify at the `netlify/functions` folder and adds the
  CORS headers needed by the extension.

## Environment variables (set in Netlify → Site settings → Build & deploy →
Environment)

- `GEMINI_API_KEY` – **required.** Your Google API key.
- `SANDBOX_SECRET` – optional. If set, the sandbox must send the same string in
  the `x-sandbox-secret` header.

## Deploying

1. Create a new site in Netlify (Deploy manually → drag this folder, or connect
   a Git repo that contains it).
2. After the first deploy, go to *Site settings → Environment variables* and add
   `GEMINI_API_KEY` (and `SANDBOX_SECRET` if you want to require it). Redeploy.
3. Pop the deployed URL (it will look like
   `https://your-site.netlify.app/.netlify/functions/gemini`) into
   `llm/adapter.js` inside the extension so the sandbox hits this proxy.

