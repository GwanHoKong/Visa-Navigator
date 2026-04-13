# Visa Navigator

Full-stack web app helping international students navigate the U.S. work visa process (OPT → STEM OPT → H-1B).  
Features include visa guides with checklists, interactive timelines, and an ML-powered H-1B sponsorship risk assessment tool.

## Project Structure

```
visa-navigator/
├── data/                   # Raw CSVs + processed datasets
├── ml/                     # Model training, feature engineering, evaluation
│   ├── preprocess.py       # Data loading & feature engineering pipeline
│   ├── train.py            # Model training (Logistic Regression)
│   └── evaluate.py         # Model evaluation metrics
├── backend/                # FastAPI application
│   ├── main.py             # FastAPI entry point
│   ├── models/             # Saved .joblib model files
│   ├── routers/            # API endpoint definitions
│   │   ├── predict.py      # POST /api/predict
│   │   ├── timeline.py     # GET /api/timeline
│   │   ├── industries.py   # GET /api/industries
│   │   └── companies.py    # GET /api/companies
│   ├── lookups/            # Pre-computed stat tables
│   ├── render.yaml         # Render deployment config
│   └── requirements.txt    # Python dependencies
├── frontend/               # Next.js application
│   ├── components/         # Reusable UI components
│   ├── app/                # App Router pages
│   ├── data/               # Visa info JSON content files
│   ├── .env.example        # Environment variable template
│   └── .env.local          # Local env vars (git-ignored)
├── docs/                   # Project documentation
└── README.md
```

## Tech Stack

- **Frontend:** React 19 + Next.js 16 (App Router), CSS
- **Backend:** FastAPI (Python 3.11+)
- **ML:** scikit-learn (Logistic Regression), pandas, numpy, joblib
- **Deployment:** Vercel (frontend) + Render (backend)

---

## Local Development

### Prerequisites

- **Node.js** 18+ and **npm**
- **Python** 3.11+ and **pip**

### 1. Backend

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.  
API docs at `http://localhost:8000/docs`.

### 2. Frontend

```bash
cd frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.  
It reads the API URL from `NEXT_PUBLIC_API_URL` (defaults to `http://localhost:8000/api`).

### 3. ML Pipeline (optional)

Only needed if you want to retrain the model with new data:

```bash
cd ml
python preprocess.py   # Preprocess raw data
python train.py        # Train model
python evaluate.py     # Evaluate model
```

Trained model files are saved to `backend/models/`.

---

## Deployment

### Frontend → Vercel

1. Push the repo to GitHub.

2. Go to [vercel.com](https://vercel.com) → **New Project** → Import your repo.

3. Set the **Root Directory** to `frontend`.

4. Add the environment variable:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend.onrender.com/api` |

5. Click **Deploy**.

> After deployment, note your Vercel URL (e.g., `https://visa-navigator.vercel.app`).  
> You'll need it for the backend CORS config.

### Backend → Render

1. Go to [render.com](https://render.com) → **New** → **Web Service**.

2. Connect your GitHub repo.

3. Configure:

   | Setting | Value |
   |---------|-------|
   | **Root Directory** | `backend` |
   | **Runtime** | Python |
   | **Build Command** | `pip install -r requirements.txt` |
   | **Start Command** | `uvicorn main:app --host 0.0.0.0 --port $PORT` |

4. Add the environment variable:

   | Key | Value |
   |-----|-------|
   | `ALLOWED_ORIGINS` | `https://visa-navigator.vercel.app,http://localhost:3000` |

   > Replace `visa-navigator.vercel.app` with your actual Vercel domain.

5. Click **Deploy**.

> Alternatively, you can use the provided `render.yaml` for [Infrastructure as Code](https://render.com/docs/infrastructure-as-code) deployment.

---

## Environment Variables

### Frontend (`frontend/.env.local`)

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:8000/api` |

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `ALLOWED_ORIGINS` | Comma-separated CORS origins | `http://localhost:3000` |

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/industries` | List available NAICS industry codes |
| `POST` | `/api/predict` | H-1B approval risk prediction |
| `GET` | `/api/companies?industry=54&state=CA` | Company recommendations with progressive relaxation |
| `GET` | `/api/timeline?graduation_date=2025-05-15` | Personalized visa timeline milestones |
