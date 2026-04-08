# CodeGuardian AI – Predictive Security Intelligence System

CodeGuardian AI is an advanced, full-stack predictive security intelligence platform. Powered by AI and Retrieval-Augmented Generation (RAG), it deeply analyzes project dependencies to identify vulnerabilities, predict future risks, suggest fixes, and simulate attack scenarios.

## Features

- **Dependency Parsing**: Automatically parses `requirements.txt` or `package.json`.
- **RAG-Powered Intelligence**: Uses `sentence-transformers` and `FAISS` to match dependencies against a curated, embedded CVE vulnerability dataset.
- **Decision Engine Engine**: Recommends whether you should `upgrade`, `replace`, or `ignore` based on context.
- **Attack Simulation**: Visually explains and simulates exactly how an attacker might exploit a discovered vulnerability.
- **Vibrant Interactive UI**: Built with React, TailwindCSS, and Framer Motion for a "WOW factor" dark theme, particle networking background, and smooth animations.

## Setup

### Backend (FastAPI + Python)

1. Navigate to backend:
   ```bash
   cd backend
   ```
2. Set up the Python environment and install requirements:
   ```bash
   python -m venv venv
   source venv/bin/activate  # Or `venv\Scripts\activate` on Windows
   pip install -r requirements.txt
   ```
3. Set your API Key (Optional but needed for dynamic LLM results):
   Create a `.env` file in the `/backend` folder:
   ```env
   GEMINI_API_KEY=your_google_ai_key
   ```
   *(If not provided, the local mock generation fallback will still render the RAG evidence).*

4. Run the API:
   ```bash
   python main.py
   ```

### Frontend (React + Vite)

1. Navigate to frontend:
   ```bash
   cd frontend
   ```
2. Start the Vite dev server (dependencies should already be installed via npm):
   ```bash
   npm run dev
   ```

3. Open `http://localhost:5173/` in your browser.

## Sample Run

Paste the following sample into the dashboard:
```txt
flask==1.0
requests>=2.0
react==17.0.0
lodash==4.17.20
```

Click **Initiate Neural Scan** to watch the RAG pipeline analyze the embedded mock dataset and deliver intelligent vulnerability scores!
