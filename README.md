# JugaadGPT - Odyssey-IUA-2026

Welcome to JugaadGPT, an AI that generates practical, low-cost jugaad solutions grounded in real Indian constraints — budget in rupees, available materials, power availability, and local climate.

**IMPORTANT STATUS UPDATE:**
> ⚠️ **The AI backend has been taken offline to avoid hosting and infrastructure costs.**
> JugaadGPT was originally built as a hackathon project. You can still fully explore the frontend, product experience, interfaces, and project information, but interactive AI responses are temporarily disabled.

## Repositories & Packages
This monorepo contains all source code for JugaadGPT:
- `landing/` - The Next.js landing page.
- `jugaadgpt-frontend/web/` - The Next.js web application.
- `src/` - The Vite + React web application.
- `jugaadgpt-backend/` - The FastAPI backend services.
- `expo-app/` - The React Native (Expo) mobile application.

## Tech Stack
- **Frontend:** React, Next.js, Vite
- **Backend:** FastAPI, Python
- **Database:** Postgres / ChromaDB (for RAG)
- **Mobile:** Expo / React Native

## Local Development
To run any of the frontends locally, navigate to their respective directories, install dependencies, and start the development server.

```bash
cd jugaadgpt-frontend/web
npm install
npm run dev
```

*Note: Since the production backend is currently offline, interactive chat features will show an "AI Offline" notice on the frontend.*

