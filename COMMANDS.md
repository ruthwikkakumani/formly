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

SQLite is created automatically as `backend/typeform.db` on first start. You never create the DB by hand.

## 2. Frontend (Next.js)

Open a **second** terminal:

```bash
cd frontend
npm install
npm run dev
```

App: http://localhost:3000  
Register (first owner): http://localhost:3000/register  
Public form (no login): http://localhost:3000/f/product-feedback  
Team: http://localhost:3000/team  
Templates: dashboard **Templates** tab (starter kits; creates a draft form)

Later teammates cannot register themselves — invite them from `/team` (email + copy link).

Live collab demo: sign in as two different accounts (two browsers), open the same form. You will see the other editor. Save in one — the other reloads the saved form if their canvas is clean. This is not Google Docs live typing. Closing the builder clears presence.

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

```bash
git push -u origin master
```

## 5. Docker images

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t ruthwikkakumani/formly-backend:latest --push ./backend
docker buildx build --platform linux/amd64,linux/arm64 -t ruthwikkakumani/formly-frontend:latest --push ./frontend
```

The images do **not** contain a database file. On boot the API creates `/data/typeform.db` and tables, then seeds forms.

Local:

```bash
docker compose up
```

## 6. Deploy (Railway + Cloudflare)

Two Railway services, one volume.

### Backend (`ruthwikkakumani/formly-backend`)

1. Volume mount path: `/data`
2. Custom domain: `formly-api.rdrt.dev`
3. Variables — do **not** wrap values in quotes:

```
DATABASE_URL=sqlite:////data/typeform.db
UPLOAD_DIR=/data/uploads
CORS_ORIGINS=https://formly.rdrt.dev
FRONTEND_URL=https://formly.rdrt.dev
AUTH_SECRET=a-long-random-string
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=you@gmail.com
SMTP_PASSWORD=your-16-char-app-password
SMTP_FROM=you@gmail.com
```

`DATABASE_URL` needs **four** slashes (`sqlite:////data/...`) so SQLite opens the absolute path `/data/typeform.db`. Gmail app password must have no spaces. `SMTP_FROM` can be omitted (defaults to `SMTP_USER`). Invite emails are a branded HTML table (Gmail-safe) plus a plaintext fallback.

Railway often blocks outbound SMTP to Gmail (ports 587/465). When that happens the invite is still created — use **Copy invite link** on the team page. Local SMTP usually works.

Or Resend: `RESEND_API_KEY=re_...` and `INVITE_FROM_EMAIL=Formly <onboarding@resend.dev>`.

### Frontend (`ruthwikkakumani/formly-frontend`)

Custom domain: `formly.rdrt.dev`

```
NEXT_PUBLIC_API_URL=https://formly-api.rdrt.dev/api
```

Cloudflare: CNAME `formly` and `formly-api` to the Railway `*.up.railway.app` hosts, plus each `_railway-verify.*` TXT. SSL mode **Full**.

## 7. What to submit

- GitHub: https://github.com/ruthwikkakumani/formly
- Demo: https://formly.rdrt.dev (open `/f/product-feedback` with no login; `/register` to create the owner)
