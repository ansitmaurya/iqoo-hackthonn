# TraceGuard Backend — Flask & PostgreSQL / Supabase API

Modular REST API service and risk evaluation engine for **TraceGuard**.

---

## 1. Local Setup & Installation

### Prerequisites
- Python 3.10+ (tested on Python 3.10 – 3.14)
- PostgreSQL / Supabase account (or local SQLite fallback)

### Installation Steps

```bash
# 1. Navigate to the backend directory
cd backend

# 2. Create and activate a virtual environment
python -m venv venv

# Windows (Command Prompt / PowerShell)
.\venv\Scripts\activate

# macOS / Linux
source venv/bin/activate

# 3. Install dependencies
pip install -r requirements.txt
```

---

## 2. Supabase / PostgreSQL Configuration

1. Log into your [Supabase Dashboard](https://app.supabase.com/) and create a new project.
2. Under **Project Settings** $\rightarrow$ **Database**, copy your **Connection String** (choose **URI** format).
   ```text
   postgresql://postgres:[YOUR-PASSWORD]@db.[YOUR-PROJECT-REF].supabase.co:5432/postgres
   ```
3. Run the database migration script:
   - Open the Supabase **SQL Editor** tab and execute the SQL contents of [`backend/migrations/schema.sql`](migrations/schema.sql).
   - Alternatively, the Flask app automatically applies schema initialization and baseline seeds on startup when connected.

---

## 3. Environment Variables

Copy `.env.example` to `.env` in the `backend/` directory:

```bash
cp .env.example .env
```

| Variable | Default Value | Description |
| :--- | :--- | :--- |
| `DATABASE_URL` | `postgresql://...` | Full Supabase / PostgreSQL connection URI. |
| `SQLITE_FALLBACK` | `true` | If `true`, enables zero-config local SQLite testing when Supabase is not configured. |
| `SECRET_KEY` | `traceguard-dev-secret` | Flask session & cryptographic signing key. |
| `CORS_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Allowed frontend origin URLs (comma-separated). |
| `PORT` | `5000` | Local or production HTTP port. |

---

## 4. Running Locally

```bash
# From the backend directory:
python app.py
```
The server will boot on `http://127.0.0.1:5000/`.

---

## 5. Connecting the Frontend

1. Ensure the frontend has `VITE_API_BASE_URL` in `.env`:
   ```env
   VITE_API_BASE_URL=http://localhost:5000/api
   ```
2. Start the Vite frontend:
   ```bash
   npm run dev
   ```
3. The dashboard header will display `API: POSTGRES LIVE` when connected.

---

## 6. API Endpoints & Example `curl` Requests

### Health Check
```bash
curl http://127.0.0.1:5000/api/health
```

### Get Dashboard Metrics
```bash
curl http://127.0.0.1:5000/api/dashboard
```

### List Transactions (with Filtering & Pagination)
```bash
curl "http://127.0.0.1:5000/api/transactions?page=1&limit=10&status=SETTLED&min_risk=40"
```

### Ingest & Score a New Transaction
```bash
curl -X POST http://127.0.0.1:5000/api/transactions \
  -H "Content-Type: application/json" \
  -d '{
    "sender": "ACC-10000",
    "sender_name": "Apex Capital Ltd",
    "receiver": "ACC-10411",
    "receiver_name": "Quantum Dynamics LLC",
    "amount": 75000.00,
    "currency": "USD",
    "type": "CRYPTO_DEPOSIT",
    "category": "CRYPTO_EXCHANGE",
    "location": {
      "city": "Singapore",
      "country": "SG",
      "latitude": 1.3521,
      "longitude": 103.8198,
      "ipAddress": "185.220.101.5"
    }
  }'
```

### Get Alerts Queue
```bash
curl "http://127.0.0.1:5000/api/alerts?status=OPEN&limit=10"
```

### Update Alert Status & Resolution
```bash
curl -X PUT http://127.0.0.1:5000/api/alerts/ALT-88AF4 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "IN_REVIEW",
    "assignedAnalyst": "Analyst Sarah (SecOps)",
    "note": "Investigating rapid offshore wire egress."
  }'
```

### Get Network Graph Topology
```bash
curl http://127.0.0.1:5000/api/network
```

---

## 7. Deploying to Render

1. Create a new **Web Service** on [Render](https://render.com/).
2. Connect your GitHub repository.
3. Configure the build settings:
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app` (or `python app.py`)
4. Set **Environment Variables** in Render:
   - `DATABASE_URL`: Your Supabase connection string.
   - `CORS_ORIGINS`: Your deployed frontend URL (e.g. `https://traceguard.vercel.app`).
   - `SECRET_KEY`: A strong random string.
5. In your frontend hosting platform (e.g. Vercel / Netlify), set:
   ```env
   VITE_API_BASE_URL=https://your-backend.onrender.com/api
   ```
