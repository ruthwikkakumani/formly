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

```bash
git add frontend backend README.md COMMANDS.md .gitignore
git status
git commit -m "$(cat <<'EOF'
Ship Formly Typeform clone with builder, public fill, results, and collaboration.

EOF
)"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git push -u origin main
```

On GitHub: create an empty public repo first, then replace `YOUR_USERNAME/YOUR_REPO`.

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

- GitHub: `https://github.com/YOUR_USERNAME/YOUR_REPO`
- Demo: your Vercel URL (try `/f/product-feedback` with no login)
