# 🌌 Project Hail Mary: Alien Language Decoder

> "No dictionary. No translator. No shortcuts. Pure pattern recognition."

An interactive, first-contact survival simulation inspired by Andy Weir's *Project Hail Mary*. This application utilizes the **openai/gpt-oss-120b** LLM engine as an Alien Intelligence. You must communicate with it completely blindly, deducing its language through repeated interaction, gestures, and pattern recognition. 

## Features
- **Blind Communication Engine**: The AI is strictly barred from using English, Native Scripts (Arabic, Kanji, Cyrillic), or any known dictionary. It strictly responds in phonetic transliterations of foreign/alien languages.
- **Hypothesis Scanner**: Enter your grammatical or vocabulary theories and the system will run a meta-validation scan, confirming your deductions without spoiling the language.
- **Persistent Codex**: As you crack words and phrases, log them in your personal Codex. Your vocabulary is saved directly to your local browser storage.
- **Dynamic Fictional Languages**: Type in arbitrary alien languages (e.g. *Klingon*, *Tonal Heptapod*) and the 120-Billion parameter engine immediately adapts its linguistic ruleset.
- **Mobile Responsive Drawer**: A sleek tactical layout that naturally drops the Codex into a sliding drawer on mobile devices.

## 🚀 Setup & Installation

To run this application safely locally, you need your own [NVIDIA NIM API Key](https://build.nvidia.com) (or OpenAI key, depending on backend config). 

1. **Clone the Repo**
   ```bash
   git clone https://github.com/your-username/project-hail-mary.git
   cd "project-hail-mary"
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Set Up the Environment**
   Create a `.env` file at the root of the project:
   ```env
   # NEVER UPLOAD THIS TO PUBLIC GITHUB
   NVIDIA_API_KEY=nvapi-...
   ```

4. **Boot the Simulation**
   This starts the Vite Frontend and the Express Backend proxy concurrently:
   ```bash
   npm run dev
   ```

## 🛠 Deployment
This codebase uses a secure Node.js proxy to conceal your API keys from the client-side React code. Because of this, it **cannot** be deployed strictly on basic static hosting like GitHub Pages. 

Deploy on a full-stack platform like **Render**, **Railway**, or **Heroku**:
- Set the Root Directory.
- Build Command: `npm install && npm run build`
- Start Command: `node server.js`
- **Crucial**: Inject the `NVIDIA_API_KEY` into your platform's Environment Variables panel.

---
*Good luck logging the lexicon, Grace.*
