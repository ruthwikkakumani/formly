# Formly — Typeform-inspired full-stack form builder

**GitHub (public):** [https://github.com/ruthwikkakumani/formly](https://github.com/ruthwikkakumani/formly)

Formly clones Typeform’s workspace, builder, and conversational one-question-at-a-time fill flow. Creators build and publish forms; anyone with the link can respond without logging in.

The repository contains `frontend/` and `backend/` as required by the assignment. Seeded published forms load on first API start. The first person to register at `/register` becomes the workspace owner; later accounts join only by invite. Public fill (`/f/{slug}`) needs no login.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic
- **Database:** SQLite file created on boot. Local: `backend/typeform.db`. Railway: `/data/typeform.db` on a volume (`DATABASE_URL=sqlite:////data/typeform.db` — four slashes). The Docker image does **not** bake in a database.

## Run locally

See **[COMMANDS.md](./COMMANDS.md)** for copy-paste commands (local, GitHub, deploy).

```bash
cd backend && python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt && uvicorn main:app --reload --port 8000
```

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:3000 — API docs at http://localhost:8000/docs.

## Design docs (LLD + UML)

Full LLD, folder map, and diagrams live in **[`docs/`](./docs/README.md)** (Mermaid, renders on GitHub).

| Doc | Link |
|---|---|
| LLD | [docs/lld.md](./docs/lld.md) |
| Folder structure | [docs/folder-structure.md](./docs/folder-structure.md) |
| Use case | [docs/diagrams/use-case.md](./docs/diagrams/use-case.md) |
| Class / UML | [docs/diagrams/class-uml.md](./docs/diagrams/class-uml.md) |
| Sequence | [docs/diagrams/sequence.md](./docs/diagrams/sequence.md) |
| Activity | [docs/diagrams/activity.md](./docs/diagrams/activity.md) |
| State machines | [docs/diagrams/state.md](./docs/diagrams/state.md) |
| DB / ER schema | [docs/diagrams/db-schema.md](./docs/diagrams/db-schema.md) |
| Component + deploy | [docs/diagrams/component.md](./docs/diagrams/component.md) |

## Architecture

```
Page → View → Hook → lib/api → FastAPI route → Service → Repository → SQLite
```

Public fill (`/f/{slug}` and `/api/public/...`) never requires auth. Draft forms return 404 on the public API.

## Folder structure

```
formly/
├── docs/                 LLD + UML + sequence + ER
├── backend/
│   ├── main.py           app composition root
│   └── app/
│       ├── core/         config, constants
│       ├── db/           engine, session
│       ├── models/       Form, Question, Response, Answer, Partial, Member, Invite, Presence, Activity
│       ├── schemas/      Pydantic DTOs
│       ├── repositories/ SQL access
│       ├── services/     rules, auth, invites, email, seed, webhooks, collaboration
│       └── api/routes/   auth, forms, public, team, invites, health
└── frontend/
    ├── app/              /, /login, /register, /invite/[token], /builder/[id], /f/[slug], /team
    ├── components/       dashboard (incl. templates), builder, results, settings, respondent, team
    ├── hooks/            useForms, useBuilder, useRespondent, useCurrentUser
    ├── lib/              api, types, validation, templates, errors
    └── styles/           per-surface CSS
```

## Database schema

```mermaid
erDiagram
  forms ||--|{ questions : has
  forms ||--o{ responses : collects
  forms ||--o{ partial_responses : tracks
  forms ||--o{ form_presence : editors
  forms ||--o{ form_activity : history
  responses ||--|{ answers : contains
  questions ||--o{ answers : answered_as

  forms {
    int id PK
    string slug UK
    string status
    string updated_by
    json theme
  }
  questions {
    int id PK
    int form_id FK
    int position
    string type
  }
  responses {
    int id PK
    int form_id FK
  }
  answers {
    int id PK
    int response_id FK
    int question_id FK
    text value
  }
```

Saving a form updates questions by id so historical answers are kept. Full column list: [docs/diagrams/db-schema.md](./docs/diagrams/db-schema.md).

## API overview

- `GET/POST /api/forms` · `GET/PUT/PATCH/DELETE /api/forms/{id}`
- `POST /api/forms/{id}/duplicate` · `POST /api/forms/{id}/publish`
- `GET /api/forms/{id}/responses` · `GET /api/forms/{id}/stats` · `GET /api/forms/{id}/responses.csv`
- `POST/GET/DELETE /api/forms/{id}/presence` · `GET /api/forms/{id}/activity`
- `GET /api/public/{slug}` · `POST /api/public/{slug}/responses|partial|upload`
- `POST /api/auth/register` · `POST /api/auth/login` · `GET /api/auth/me`
- `GET/POST /api/workspace/members` · `DELETE /api/workspace/members/{id}`
- `GET/POST /api/workspace/invites` · `DELETE /api/workspace/invites/{id}`
- `GET /api/invites/{token}` · `POST /api/invites/{token}/accept`
- `GET /api/health`

## Features

Builder, CRUD, publish/share, conversational fill (keyboard + progress + validation), results + CSV, themes (colors, fonts, background, dark mode), thank-you copy, logic jumps, file upload, payments, webhooks, workspace collaboration, who-is-editing + save history, starter **templates**, seeded published forms.

**Auth.** First `/register` creates the owner. After that, new people join only by accepting an invite. Public `/f/{slug}` stays open with no login.

**Invites.** Team page sends an email and always shows a **copy link**. On Railway, Gmail SMTP (ports 587/465) is often blocked, so the email may not arrive — the invite is still created and the copy link works.

**Presence.** Other signed-in editors appear in the builder. Leaving the page clears presence. This is not Google Docs live typing: you save, then other open builders poll and reload if their draft is clean.

**Errors.** API and UI messages are situation-specific (auth, invites, publish, network). Hung requests abort after 8 seconds instead of spinning forever.

## Assignment scope

**Required:** `frontend/` + `backend/`, workspace + builder, publish + shareable public fill, conversational one-question flow, results.

**Beyond the brief:** JWT auth (owner + invite-only teammates), email invites with copy-link fallback, live presence, save history, starter templates, professional errors, and the extra question types / themes / webhooks / logic jumps that make the product feel complete.

## Assumptions

- Creators sign in with email/password. First register becomes owner; later people join only via invite accept. Public fill links stay open with no login.
- Payments record a successful pay action in the response (no live Stripe keys).
- Webhooks POST JSON on submit; a down endpoint does not fail the response.
- Team invites send a real email with an accept link when SMTP is reachable. The person is added only after they accept; ignore/revoke leaves them out. Copy link is the reliable fallback.
- Presence uses heartbeats (not WebSockets). Identity is the signed-in account. Other builders see who is there and pick up **saved** changes — not character-by-character typing.

## Demo / deployment

Live demo: [https://formly.rdrt.dev](https://formly.rdrt.dev) · API: [https://formly-api.rdrt.dev/docs](https://formly-api.rdrt.dev/docs)

Docker Hub: `ruthwikkakumani/formly-frontend` and `ruthwikkakumani/formly-backend`.

1. Railway: two services from those images. Mount a **volume at `/data`** on the backend (SQLite + uploads).
2. Backend env (no quotes around values):
   - `DATABASE_URL=sqlite:////data/typeform.db` (four slashes)
   - `UPLOAD_DIR=/data/uploads`
   - `CORS_ORIGINS=https://formly.rdrt.dev`
   - `FRONTEND_URL=https://formly.rdrt.dev`
   - `AUTH_SECRET=...` plus SMTP or Resend for invite mail
3. Frontend env: `NEXT_PUBLIC_API_URL=https://formly-api.rdrt.dev/api`

Public fill (no login): `/f/product-feedback`  
Create owner: `/register`

Step-by-step: [COMMANDS.md](./COMMANDS.md).

## Original work

Original implementation of the assignment. Not copied from another Typeform clone.
