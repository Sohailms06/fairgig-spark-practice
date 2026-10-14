# FairGig — Team Ownership & Git Collaboration Protocol

**Project:** FairGig — Gig Worker Income & Rights Platform  
**Hackathon Target Duration:** 6 Hours  
**Primary Repository:** `fairgig-spark-practice`  
**Base Branch:** `main` (Protected)  

---

## 1. Ownership Matrix

| Area / File Path | Primary Owner | Secondary Reviewer | Rules & Boundaries |
|---|---|---|---|
| `packages/contracts/**` | **Developer A (Phase 0)** | Developer B | **CRITICAL:** Shared contract boundary. Requires mutual sign-off before modifying after Phase 0 initial commit. |
| `services/auth/**` | **Developer A** | Developer B | Python FastAPI |
| `services/earnings/**` | **Developer A** | Developer B | Python FastAPI |
| `services/anomaly/**` | **Developer A** | Developer B | Python FastAPI |
| `services/analytics/**` | **Developer A** | Developer B | Python FastAPI |
| `services/grievance/**` | **Developer A** | Developer B | Node.js / TypeScript |
| `services/certificate/**` | **Developer A** | Developer B | Node.js / TypeScript |
| `supabase/**` | **Developer A** | Developer B | SQL Migrations, Seed & RLS policies |
| `apps/web/**` | **Developer B** | Developer A | Next.js 14 App Router, UI components, Tailwind CSS |
| `docs/architecture.md` | **Developer A** | Developer B | System design and database schema |
| `docs/team-ownership.md` | **Both Developers** | - | Collaboration agreement |
| `tests/backend/**` | **Developer A** | Developer B | Pytest & Node service tests |
| `tests/frontend/**` | **Developer B** | Developer A | Component & E2E smoke tests |

---

## 2. Git Branching Strategy

```
main (Production baseline, stable releases only)
  │
  ├── feature/backend  (Developer A workspace: services, DB, contracts)
  │
  └── feature/frontend (Developer B workspace: apps/web UI/UX, client integration)
```

### Protocol Rules:
1. **Never commit directly to `main`** during hackathon implementation.
2. Developer A works on `feature/backend`.
3. Developer B works on `feature/frontend`.
4. **Never force-push (`git push --force`)** or rewrite shared git history.
5. **No automatic merging:** Frontend and backend branches must only be merged to `main` through an agreed pull request or collaborative manual merge once both sides are verified.
6. **Shared Contract Agreement:**
   - Any proposed change to `packages/contracts` must be communicated verbally or via chat before making the commit.
   - Run `npm run build:contracts` and `npm run typecheck` to ensure backward compatibility before pushing contract changes.

---

## 3. Developer B Quickstart Guide

To clone and begin frontend work:

```bash
# 1. Clone repository
git clone https://github.com/<YOUR_GITHUB_USER>/fairgig-spark-practice.git
cd fairgig-spark-practice

# 2. Checkout the frontend feature branch
git checkout feature/frontend

# 3. Install JavaScript dependencies
npm install

# 4. Build shared contracts
npm run build:contracts

# 5. Copy frontend environment file
copy apps\web\.env.example apps\web\.env.local

# 6. Start Next.js development server
npm run dev:web
# Web UI runs at http://localhost:3000
```
