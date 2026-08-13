# Formly — Typeform-inspired full-stack form builder

Formly is a complete Typeform-style product: creators manage and build forms, publish a public share link, collect one-question-at-a-time responses, and inspect results. It includes usable seeded data on first launch.

## Stack

- **Frontend:** Next.js 15, TypeScript, responsive CSS (no UI-kit dependency)
- **Backend:** FastAPI, SQLAlchemy 2
- **Persistence:** SQLite (`backend/typeform.db`)

## Run locally

Open two terminals from the repository root.

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

```bash
cd frontend
npm install
npm run dev
```

Visit `http://localhost:3000`. The API docs are at `http://localhost:8000/docs`.

For a hosted frontend, set `NEXT_PUBLIC_API_URL` to the deployed backend URL followed by `/api`, and add the frontend host to FastAPI CORS origins in `backend/main.py`.

## Features

- Form CRUD: create, rename (inline), duplicate, delete, publish/unpublish and share link
- Builder: ordered questions, add/edit/delete/reorder controls, eight question types, required/help settings, live preview, save toast
- Public full-screen conversational flow: transitions, progress, Enter navigation, client and server validation, thank-you state
- Results: persisted submissions, submission table and choice-question counts
- Builder tabs include practical Results plus a Settings placeholder tab
- Fresh database seeding creates a published Product Feedback form and sample response

## Architecture

`frontend/app/page.tsx` is the creator dashboard. `frontend/app/builder/[id]/page.tsx` owns builder state and sends a complete form definition on Save. `frontend/app/f/[slug]/page.tsx` is deliberately public and has no creator authentication. `backend/main.py` provides REST endpoints, validation and lifecycle seeding; `models.py` keeps data relationships in one place.

## Database schema

| Table | Purpose |
|---|---|
| `forms` | Form metadata, publish status, public slug and theme |
| `questions` | Ordered questions belonging to a form; stores type/options/settings |
| `responses` | A submitted response for a form with timestamp |
| `answers` | An individual answer joining a response and question |

Deleting a form cascades to its questions, responses and answers. Answers remain queryable per question for summaries.

## API overview

- `GET/POST /api/forms`, `GET/PUT/DELETE /api/forms/{id}`
- `POST /api/forms/{id}/duplicate`, `POST /api/forms/{id}/publish`
- `GET /api/public/{slug}`, `POST /api/public/{slug}/responses`
- `GET /api/forms/{id}/responses`, `GET /api/forms/{id}/stats`

## Assumptions and placeholders

The assignment permits simplified creator auth, so Formly uses a default workspace. Settings is intentionally a placeholder tab; integrations, logic jumps, team collaboration, payments, and file uploads are outside the required feature set. Reordering is presented with clear move controls, which is keyboard/touch accessible; native drag-and-drop can be added without changing the persistence schema.
