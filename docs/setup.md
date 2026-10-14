# FairGig — Local Developer Setup Guide (Windows)

This document provides step-by-step instructions for running FairGig on two Windows developer laptops.

---

## 1. System Requirements

- **Operating System:** Windows 10 / 11 (64-bit)
- **Node.js:** `v20.19.x` or later ([Download Node LTS](https://nodejs.org/))
- **npm:** `10.8.x` or later (bundled with Node)
- **Python:** `3.10+` or `3.12+` ([Download Python](https://www.python.org/))
  - *Important:* Ensure "Add Python to PATH" is checked during Windows installer.
- **Git for Windows:** `2.40+` ([Download Git](https://gitforwindows.org/))

---

## 2. Clone & Initial Workspace Setup

Open PowerShell as standard user:

```powershell
# Clone the repository
git clone https://github.com/<YOUR_GITHUB_USER>/fairgig-spark-practice.git
cd fairgig-spark-practice

# Configure Windows line-ending handling
git config core.autocrlf true
```

### Install JavaScript Workspaces
```powershell
# From the repository root
npm install

# Build shared contracts package
npm run build:contracts
```

---

## 3. Python Services Virtual Environments

Each FastAPI service can run with an independent virtual environment:

### Option A: Shared Development Venv (Fastest for 6-Hour Hackathon)
```powershell
# Create root venv
python -m venv .venv

# Activate in PowerShell
.\.venv\Scripts\Activate.ps1

# Install requirements for all FastAPI services
pip install -r services\auth\requirements.txt
pip install -r services\earnings\requirements.txt
pip install -r services\anomaly\requirements.txt
pip install -r services\analytics\requirements.txt
```

> **Note on PowerShell Execution Policy:**  
> If `.venv\Scripts\Activate.ps1` gives an execution policy error, run:  
> `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`

### Option B: Isolated Per-Service Venvs
```powershell
# Example for Auth Service
cd services\auth
python -m venv venv
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

---

## 4. Running the Development Stack

Open separate PowerShell tabs for the services you are working on:

### Tab 1: Next.js Frontend (Port 3000)
```powershell
npm run dev:web
# UI is live at http://localhost:3000
```

### Tab 2: Python FastAPI Services
```powershell
# Auth (:8001)
python -m uvicorn services.auth.main:app --host 127.0.0.1 --port 8001 --reload

# Earnings (:8002)
python -m uvicorn services.earnings.main:app --host 127.0.0.1 --port 8002 --reload

# Anomaly (:8003)
python -m uvicorn services.anomaly.main:app --host 127.0.0.1 --port 8003 --reload

# Analytics (:8004)
python -m uvicorn services.analytics.main:app --host 127.0.0.1 --port 8004 --reload
```

### Tab 3: Node.js / TypeScript Services
```powershell
# Grievance (:4001)
npm run dev:grievance

# Certificate (:4002)
npm run dev:certificate
```

---

## 5. Supabase Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor**.
3. Run the schema migration from `supabase/migrations/20261014000000_initial_schema.sql`.
4. Run the reference seed from `supabase/seed/seed.sql`.
5. Under **Storage**, create a private bucket named `evidence-private` (Set Public Bucket: **OFF**).
6. Copy Project URL, Anon Key, and Service Role Key into your `.env` file (copied from `.env.example`).
