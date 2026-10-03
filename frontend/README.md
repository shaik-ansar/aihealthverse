# 💻 AI HealthVerse — Frontend

This is the React 19 + Vite frontend application for **AI HealthVerse**.

## ⚡ How to Run

### 1️⃣ Start Backend Server (First Terminal)
Before launching the frontend, ensure the FastAPI backend is running on `http://localhost:8000`:
```bash
cd ../backend

# Activate Python environment & run backend
.\venv\Scripts\Activate.ps1   # On Windows
source venv/bin/activate      # On Linux/macOS

uvicorn main:app --reload --port 8000
```

### 2️⃣ Start Frontend Application (Second Terminal)
```bash
cd frontend

# Install Node dependencies (if first time)
npm install

# Start Vite development server
npm run dev
```

Open your browser at **[http://localhost:5173](http://localhost:5173)**.

---

## 🛠️ Build & Scripts

- `npm run dev` — Launch Vite dev server with HMR.
- `npm run build` — Build production bundle to `dist/`.
- `npm run preview` — Locally preview the production build.
- `npm run lint` — Run oxlint code check.
