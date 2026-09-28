# 🎙️ JobPilot AI — Interactive Voice & Video Mock Interviewer

JobPilot AI is a modern, real-time AI-powered mock technical interview platform built with **React 19**, **TypeScript**, **Vite**, and **Tailwind CSS v4**. It provides job seekers with a realistic video call environment to practice technical and behavioral interviews, receive real-time speech transcription, and obtain instant, comprehensive multi-metric evaluations powered by AI.

---

## ✨ Key Features

- 🎯 **Customizable Interview Setup**: Select target roles (Frontend, Backend, Fullstack, DevOps, Mobile, System Design, Behavioral), seniority levels (Junior to Lead), question counts, and question time limits.
- 🤖 **Dynamic Question Generation**: Generates targeted questions using Google Gemini API, with built-in high-quality fallback preset question banks for offline or keyless use.
- 📹 **Realistic Interview Room**: Features live camera preview, active speaker visualizers, interactive hint toggles, and live countdown timers.
- 🗣️ **Voice & Speech Synthesis**:
  - **Speech-to-Text (STT)**: Real-time candidate voice capture using the Web Speech API.
  - **Text-to-Speech (TTS)**: Dynamic AI interviewer voice reading questions aloud.
  - **Technical Jargon Engine**: Automatic phonetic correction for technical terms (e.g., converting "virtual dumb" to "Virtual DOM" or "post grace" to "PostgreSQL").
- 📊 **Multi-Metric Scorecard & AI Evaluation**:
  - Overall performance score (0–100) with candidate readiness verdicts.
  - Detailed breakdown across **Technical Accuracy**, **Communication Clarity**, and **Completeness**.
  - Question-by-question analysis featuring benchmark answers, strength highlights, improvement areas, and key missed concepts.
- 📜 **Session History & Analytics**: Local storage persistence allows candidates to track practice history and review past performance scorecards.
- 🔑 **Flexible AI Configuration**: Configure your own Google Gemini API key or custom proxy endpoint directly in the application settings.

---

## 🛠️ Tech Stack

- **Core**: React 19, TypeScript, Vite 8
- **Styling**: Tailwind CSS v4 (`@tailwindcss/vite`), Custom dark mode glassmorphism
- **Icons**: Lucide React
- **Voice & Media**: HTML5 `getUserMedia`, Web Speech API (`SpeechSynthesis` & `SpeechRecognition`)
- **Linter & Quality**: Oxlint

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` or `pnpm` or `yarn`

### Installation

1. Navigate to the project directory:
   ```bash
   cd projects/ai-interview
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173`.

---

## 📜 Available Scripts

- `npm run dev` — Starts the Vite development server with HMR.
- `npm run build` — Runs TypeScript type-checking and builds the application for production (`dist/`).
- `npm run preview` — Previews the production build locally.
- `npm run lint` — Runs `oxlint` for fast code linting.

---

## ⚙️ Configuration & API Key Setup

JobPilot AI works out-of-the-box using built-in preset question banks and benchmark rubrics without requiring an API key. 

To enable live AI question generation and AI feedback synthesis:
1. Click the **API Settings** button in the top navigation bar.
2. Enter your **Google Gemini API Key** (or custom proxy URL).
3. The key is securely stored in your browser's `localStorage` and used directly for client-side AI requests.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

