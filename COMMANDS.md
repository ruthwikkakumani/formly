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

Live collab demo: sign in as two different accounts (two browsers), open the same form, Save in one — the other shows who is editing.

## 3. Seeded data (first API start)

- Published: Product feedback, Remote work pulse  
- Draft: New customer interview  
- No fake members. Create the owner at `/register`, then invite teammates.  

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
4. Set `CORS_ORIGINS=https://formly.rdrt.dev` (plain URL, not JSON)
5. Set `FRONTEND_URL=https://formly.rdrt.dev`
6. Set email so invites actually send (pick one):

Gmail (fastest): create an App Password, then

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=Formly <you@gmail.com>
```

Or Resend: `RESEND_API_KEY=re_...` and `INVITE_FROM_EMAIL=Formly <onboarding@resend.dev>` (only delivers to your Resend account email until you verify `rdrt.dev`).

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
