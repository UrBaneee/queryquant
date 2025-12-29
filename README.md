# QueryQuant

QueryQuant is a lightweight tool to track how often you ask AI questions — and turn AI usage into a daily habit.

Instead of focusing on *what* AI can do, QueryQuant focuses on **how consistently you use AI as a thinking partner**.

Think of it as a **GitHub contribution graph — but for AI-assisted thinking**.

---

## Why QueryQuant?

I recently heard an idea that really motivated me:

> *If you ask ChatGPT 100 questions a day and keep digging deeper,  
> you’ll grow incredibly fast.*

That made me wonder:

- How many questions do I actually ask AI every day?
- What would happen if I *really* asked 100 questions daily?

QueryQuant was built to answer that question — not with motivation,  
but with **data**.

---

## Demo Video

🎥 **YouTube Demo:**  
https://youtu.be/Q6UUWAXrX4A

---

## Core Features

- **Daily AI Query Tracking**
  - Track how many AI questions you ask each day

- **Two Ways to Log Queries**
  - Built-in AI chat with automatic counting
  - Manual `+1` logging for external tools (ChatGPT, Gemini, etc.)

- **Question History Sidebar**
  - View and revisit previous questions
  - Quickly jump back to earlier parts of your thinking
  - Helps with reflection and thought review

- **Usage Dashboard**
  - Daily query count
  - Active days
  - Trend over time
  - GitHub-style contribution graph

---

## How It Works

QueryQuant is a **frontend-only application**.

- You bring your own AI API key (Gemini / OpenAI)
- All data is stored locally in your browser
- No accounts, no backend, no tracking servers
- Queries are counted automatically in the built-in chat
- External AI usage can be logged manually

This keeps everything simple, private, and transparent.

---

## Run and Deploy Your AI Studio App

This repository contains everything you need to run the app locally.

You can also view the app in AI Studio:  
https://ai.studio/apps/drive/1pSyM3nYpzR0n20xOtJ1cv0uFPUZREnQc

---

# QueryQuant 本地运行指南

## Run Locally

### Prerequisites

Make sure you have the following installed:

- **Node.js** (recommended: Node 18+)
- **npm** (comes with Node.js)

You can verify by running:

```bash
node -v
npm -v
```

---

## 1) Clone the repository

```bash
git clone https://github.com/UrBaneeee/queryquant.git
cd queryquant
```

If you already downloaded the code as a ZIP, just cd into the project folder (the one that contains `package.json`).

---

## 2) Install dependencies

```bash
npm install
```

---

## 3) Configure API keys (optional but recommended)

QueryQuant supports a built-in chat interface that can call AI providers using your own API key.

There are two common ways to set keys:

### Option A — Use the in-app Settings (recommended)

1. Start the app (see Step 4)
2. Open Settings in the UI
3. Paste your API key (Gemini / OpenAI / ...)
4. Save

> Keys are stored locally in your browser storage.
> No backend is involved.

---

### Option B — Use environment variables (for local development)

Create a file named `.env.local` in the project root:

```bash
touch .env.local
```

Add your API keys:

```bash
# Gemini
VITE_GEMINI_API_KEY=your_gemini_api_key_here

# OpenAI
VITE_OPENAI_API_KEY=your_openai_api_key_here
```

> **Note:** In a Vite project, environment variables must start with `VITE_` to be accessible in the frontend.

---

## 4) Start the development server

```bash
npm run dev
```

Vite will output a local URL, usually:

- http://localhost:5173

Open it in your browser.

---

## 5) Use the app

- Ask questions in the built-in chat → queries are counted automatically
- If you used ChatGPT or Gemini elsewhere → click **Log External Query (+1)**
- Visit the **Dashboard** to view:
  - Queries today
  - Active days
  - Trends over time
  - Contribution graph

---

## Troubleshooting

### Port already in use

If port 5173 is taken, Vite will automatically use another port.
Check the terminal output for the correct URL.

### API key not working

- Make sure the key is copied correctly
- Ensure your AI provider account has API access and billing enabled
- If you edited `.env.local`, restart the dev server:
  - stop with `Ctrl + C`
  - run `npm run dev` again

### Built-in chat feels slower than ChatGPT

This is expected in some cases.

The app sends direct API requests and handles responses entirely on the client, while ChatGPT's official UI benefits from server-side optimizations.

---

## Build for production (optional)

```bash
npm run build
npm run preview
```

- `build` creates a production-ready bundle
- `preview` serves it locally for testing

## Use Cases

- Developers learning AI tools  
- Students building AI-assisted study habits  
- Researchers tracking AI usage  
- Builders exploring AI agent workflows  
- Anyone who wants to **treat thinking as a habit**

---

## Improvements & Limitations

- **API Cost**  
  - Since you connect your own AI API key, usage may incur small costs depending on the provider.

- **Response Speed**  
  - The built-in chat may be slightly slower than ChatGPT’s official interface due to direct API calls and frontend handling.

These trade-offs were made to keep the app simple, transparent, and fully client-side.
