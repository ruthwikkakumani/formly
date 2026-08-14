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
Login (demo accounts from API): http://localhost:3000/login — reviewer default `reviewer@formly.dev` / `FormlyReview1`. Owner and viewer appear only if `OWNER_*` / `VIEWER_*` are set on the API.  
Register (first owner): http://localhost:3000/register  
Forgot password: http://localhost:3000/forgot-password  
Public form (no login): http://localhost:3000/f/product-feedback  
Workspace / team: http://localhost:3000/team  
Settings (account + team): http://localhost:3000/settings  
Templates: dashboard **Templates** tab (6 starter kits; creates a draft form)

Later teammates cannot register themselves — the owner invites them from `/team` or `/settings` (email + copy link). Invited **editors** can save and publish forms. Invited **viewers** are read-only until the owner switches their role. Only the owner can invite, remove, or change roles. The seeded reviewer is an `editor` and can save/publish.

Live collab demo: sign in as two different accounts (two browsers), open the same form. You will see the other editor. Save in one — the other reloads the saved form if their canvas is clean. This is not Google Docs live typing (no OT/CRDT). Closing or leaving the builder clears presence.

## 3. Seeded data (first API start)

- Published: Product feedback, Remote work pulse
- Draft: New customer interview
- Reviewer member (if missing): `reviewer@formly.dev` / `FormlyReview1`, role `editor` — for assignment graders. Not the owner. Create the owner at `/register`, then invite other teammates.

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

Tag both `latest` and `1.0`. Railway pulls `linux/amd64` `latest`. The documented command also builds `linux/arm64`. Frontend bakes `NEXT_PUBLIC_API_URL` at build time; the container entrypoint also writes `/runtime-config.js` from the same env var at start. Public fill needs **both** images redeployed when partial-resume changes land.

```bash
docker buildx inspect multi-builder >/dev/null 2>&1 || docker buildx create --name multi-builder --use --bootstrap

docker buildx build --builder multi-builder --platform linux/amd64,linux/arm64 \
  -t ruthwikkakumani/formly-backend:latest \
  -t ruthwikkakumani/formly-backend:1.0 \
  --push ./backend

docker buildx build --builder multi-builder --platform linux/amd64,linux/arm64 \
  -t ruthwikkakumani/formly-frontend:latest \
  -t ruthwikkakumani/formly-frontend:1.0 \
  --build-arg NEXT_PUBLIC_API_URL=https://formly-api.rdrt.dev/api \
  --build-arg NEXT_PUBLIC_REVIEWER_EMAIL=reviewer@formly.dev \
  --build-arg NEXT_PUBLIC_REVIEWER_PASSWORD=FormlyReview1 \
  --push ./frontend
```

Requires `docker login` to Docker Hub. The images do **not** contain a database file. On boot the API creates `/data/typeform.db` and tables, then seeds forms plus the reviewer editor if missing.

Railway does not auto-pull new tags unless you add Watchtower. After a push, **Redeploy** the frontend and backend services in Railway.

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
REVIEWER_EMAIL=reviewer@formly.dev
REVIEWER_PASSWORD=FormlyReview1
OWNER_EMAIL=
OWNER_PASSWORD=
VIEWER_EMAIL=viewer@formly.dev
VIEWER_PASSWORD=FormlyView1
```

`DATABASE_URL` needs **four** slashes (`sqlite:////data/...`) so SQLite opens the absolute path `/data/typeform.db`. Gmail app password must have no spaces. `SMTP_FROM` can be omitted (defaults to `SMTP_USER`). Invite emails are a branded HTML table (Gmail-safe) plus a plaintext fallback.

Railway often blocks outbound SMTP to Gmail (ports 587/465). When that happens the invite is still created — use **Copy invite link** on `/team` or `/settings`. Local SMTP usually works. Password reset uses the same SMTP; the token is created even if mail fails. Locally the forgot-password page also shows a copy link.

Or Resend: `RESEND_API_KEY=re_...` and `INVITE_FROM_EMAIL=Formly <onboarding@resend.dev>`.

### Frontend (`ruthwikkakumani/formly-frontend`)

Custom domain: `formly.rdrt.dev`

```
NEXT_PUBLIC_API_URL=https://formly-api.rdrt.dev/api
NEXT_PUBLIC_REVIEWER_EMAIL=reviewer@formly.dev
NEXT_PUBLIC_REVIEWER_PASSWORD=FormlyReview1
```

Cloudflare: CNAME `formly` and `formly-api` to the Railway `*.up.railway.app` hosts, plus each `_railway-verify.*` TXT. SSL mode **Full**.

## 7. What to submit

- GitHub: https://github.com/ruthwikkakumani/formly
- Demo: https://formly.rdrt.dev (open `/f/product-feedback` with no login; `/login` as `reviewer@formly.dev` / `FormlyReview1`; `/register` to create the owner)
