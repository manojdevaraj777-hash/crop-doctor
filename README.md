# Cropwise AI Crop & Leaf Disease Detector

Cropwise lets farmers upload a crop leaf photo, select the crop, and receive a structured AI health assessment with practical care steps.

## Run locally

Install dependencies once:

```powershell
npm install
```

Start the AI API in terminal 1:

```powershell
npm run server
```

Start the frontend in terminal 2:

```powershell
npm run dev
```

Open the local URL printed by Vite, usually http://127.0.0.1:5173/.

## Enable Groq Vision

- Copy `.env.example` to `.env`
- Add your Groq API key:

```env
GROQ_API_KEY=your_key_here
GROQ_MODEL=llama-3.2-90b-vision-preview
PORT=8787
```

Restart `npm run server` after changing `.env`. Without a key, diagnosis and chat return a configuration message rather than fabricated results. Never commit `.env`.

## Checks

```powershell
npm run build
npm run lint
```
