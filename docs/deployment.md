# FairGig — Production & Hackathon Deployment Strategy

This document describes how FairGig can be deployed for demonstration and judging at the end of the 6-hour hackathon.

---

## 1. Hosting Strategy

```
+--------------------------------------------------------+
|  Vercel                                                |
|  - apps/web (Next.js 14 App Router)                    |
|  - Root directory set to: apps/web                     |
+---------------------------+----------------------------+
                            |
           REST API / HTTPS Calls with Bearer JWT
                            |
+---------------------------v----------------------------+
|  Render / Railway / Fly.io                             |
|  - services/auth (Port 8001 / $PORT)                   |
|  - services/earnings (Port 8002 / $PORT)               |
|  - services/anomaly (Port 8003 / $PORT)                |
|  - services/grievance (Port 4001 / $PORT)              |
|  - services/certificate (Port 4002 / $PORT)            |
+---------------------------+----------------------------+
                            |
+---------------------------v----------------------------+
|  Supabase Cloud (PaaS)                                 |
|  - Managed PostgreSQL 15+ (RLS Active)                 |
|  - Supabase Storage (Private S3 bucket: evidence-priv) |
+--------------------------------------------------------+
```

---

## 2. Frontend Deployment (Vercel)

1. Connect the GitHub repository `fairgig-spark-practice` to Vercel.
2. Configure project settings:
   - **Framework Preset:** Next.js
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm run build`
   - **Install Command:** `npm install`
3. Set Environment Variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_AUTH_SERVICE_URL`
   - `NEXT_PUBLIC_EARNINGS_SERVICE_URL`
   - `NEXT_PUBLIC_ANOMALY_SERVICE_URL`
   - `NEXT_PUBLIC_ANALYTICS_SERVICE_URL`
   - `NEXT_PUBLIC_GRIEVANCE_SERVICE_URL`
   - `NEXT_PUBLIC_CERTIFICATE_SERVICE_URL`

---

## 3. Backend Services Deployment (Render / Railway)

Each service has a standard start command:

| Service | Runtime | Build Command | Start Command |
|---|---|---|---|
| `auth` | Python | `pip install -r services/auth/requirements.txt` | `uvicorn services.auth.main:app --host 0.0.0.0 --port $PORT` |
| `earnings` | Python | `pip install -r services/earnings/requirements.txt` | `uvicorn services.earnings.main:app --host 0.0.0.0 --port $PORT` |
| `anomaly` | Python | `pip install -r services/anomaly/requirements.txt` | `uvicorn services.anomaly.main:app --host 0.0.0.0 --port $PORT` |
| `analytics` | Python | `pip install -r services/analytics/requirements.txt` | `uvicorn services.analytics.main:app --host 0.0.0.0 --port $PORT` |
| `grievance` | Node.js | `npm install && npm run build:contracts && npm run build:grievance` | `node services/grievance/dist/index.js` |
| `certificate` | Node.js | `npm install && npm run build:contracts && npm run build:certificate` | `node services/certificate/dist/index.js` |

---

## 4. Health Check Monitoring

Deployments can use automated health pinging against:
- `https://<service-domain>/health`

Expected response:
```json
{
  "status": "ok",
  "service": "<service_name>",
  "version": "0.1.0",
  "timestamp": "..."
}
```
If any service returns a non-200 status code, automated container restarts will trigger.
