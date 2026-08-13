# Commands — run Formly locally, publish, and deploy

Run these from the repository root: `Scalar AI LABS`.

## 1. Backend (FastAPI + SQLite)

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

API: http://localhost:8000  
Docs: http://localhost:8000/docs  
Health: http://localhost:8000/api/health

## 2. Frontend (Next.js)

Open a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000  
Public form (no login): http://localhost:3000/f/product-feedback  
Team: http://localhost:3000/team  

Live collab demo: open the same form in two tabs, pick a different teammate in each, Save in one — the other tab shows who is editing and applies the live save.

## 3. Seeded data (first API start)

- Published: Product feedback, Remote work pulse  
- Draft: New customer interview  
- Workspace members: owner + editor  

If you need a clean seed:

```bash
rm backend/typeform.db
```

Then restart the API.

## 4. Public GitHub repository

Repo name: **formly**  
Live repo: https://github.com/ruthwikkakumani/formly

If you need to push new commits:

```bash
git push -u origin master
```

## 5. Deploy

### Backend (Render / Railway)

1. New Web Service from `backend/`
2. Dockerfile is already in `backend/Dockerfile`
3. Add a persistent disk for `typeform.db` and `uploads/`
4. Set `CORS_ORIGINS=["https://YOUR-FRONTEND.vercel.app"]`

### Frontend (Vercel)

```bash
cd frontend
npx vercel
```

Environment variable:

```
NEXT_PUBLIC_API_URL=https://YOUR-API-HOST/api
```

## 6. What to submit

- GitHub: https://github.com/ruthwikkakumani/formly
- Demo: your Vercel frontend URL (open `/f/product-feedback` with no login)
