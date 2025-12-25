# QueryQuant

QueryQuant is a lightweight tool for tracking how often you ask questions to AI tools like ChatGPT or Gemini.

Instead of focusing on *what* AI can do, QueryQuant focuses on **how consistently you use AI as a thinking partner** — and turns that behavior into measurable data.

---

## Why QueryQuant?

Using AI effectively is not about asking perfect questions —  
it's about **asking questions consistently**.

QueryQuant helps you answer questions like:

- Did I actively use AI to think today?
- Am I building a daily AI-assisted thinking habit?
- Do I rely more on in-app AI or external tools?
- How has my AI usage changed over time?

Think of it as a **GitHub contribution graph — but for thinking**.

---

## Core Features

- **Daily AI Query Tracking**
  - Track how many AI questions you ask each day

- **Two Ways to Log Queries**
  - Manual `+1` logging for external tools (ChatGPT, Gemini, etc.)
  - Built-in AI chat interface with automatic counting

- **Bring Your Own API Key**
  - Connect your own OpenAI, Gemini, or other AI provider API keys
  - No backend, no stored keys on servers

- **Usage Dashboard**
  - Daily query count
  - 7-day average
  - Active days
  - Long-term usage trends
  - Visual activity breakdown

---

## How It Works

QueryQuant is a **frontend-only application**.

- All data is stored locally (via browser storage)
- AI requests are sent directly from the client
- Query counting happens automatically for in-app conversations
- External AI usage can be manually logged with one click

No accounts.  
No tracking servers.  
No hidden analytics.

---

## Tech Stack

- **Frontend:** React + TypeScript
- **Build Tool:** Vite
- **UI:** Component-based architecture
- **AI Integration:** OpenAI API, Gemini API (user-provided keys)
- **Storage:** Local browser storage

---

## Project Structure

```txt
src/
├── components/
│   ├── Dashboard.tsx
│   ├── ChatInterface.tsx
│   ├── StatCard.tsx
│   ├── ContributionGraph.tsx
│   └── SettingsModal.tsx
├── services/
│   ├── openaiService.ts
│   ├── geminiService.ts
│   └── storageService.ts
├── App.tsx
├── index.tsx
└── types.ts
