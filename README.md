# Formly — Typeform-inspired full-stack form builder

Formly clones Typeform’s workspace, builder, and conversational one-question-at-a-time fill flow. Creators build and publish forms; anyone with the link can respond without logging in. Results, themes, webhooks, team invites, and bonus question types are included.

## Tech stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Backend:** FastAPI, SQLAlchemy 2, Pydantic
- **Database:** SQLite (`backend/typeform.db`)

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

## Architecture

```
Page → View → Hook → lib/api → FastAPI route → Service → Repository → SQLite
```

Public fill (`/f/{slug}` and `/api/public/...`) never requires auth. Draft forms return 404 on the public API.

```
backend/app/   core, db, models, schemas, repositories, services, api/routes
frontend/        app (thin pages), components, hooks, lib, styles
```

## Database schema

```
forms                 id, title, description, status, slug, webhook_url, theme JSON, timestamps
questions             id, form_id → forms, position, type, title, description, required, options JSON, logic JSON
responses             id, form_id → forms, submitted_at
answers               id, response_id → responses, question_id → questions, value
partial_responses     id, form_id → forms, visitor_id UNIQUE, answers JSON, updated_at
workspace_members     id, name, email UNIQUE, role (owner|editor|viewer), created_at
```

Saving a form updates questions by id so historical answers are kept.

## API overview

- `GET/POST /api/forms` · `GET/PUT/PATCH/DELETE /api/forms/{id}`
- `POST /api/forms/{id}/duplicate` · `POST /api/forms/{id}/publish`
- `GET /api/forms/{id}/responses` · `GET /api/forms/{id}/stats` · `GET /api/forms/{id}/responses.csv`
- `GET /api/public/{slug}` · `POST /api/public/{slug}/responses|partial|upload`
- `GET/POST /api/workspace/members` · `DELETE /api/workspace/members/{id}`
- `GET /api/health`

## Features

Builder, CRUD, publish/share, conversational fill (keyboard + progress + validation), results + CSV, themes (colors, fonts, background, dark mode), thank-you copy, logic jumps, file upload, payments, webhooks, workspace collaboration, seeded published forms.

## Assumptions

- Creator auth is a default logged-in workspace (assignment allows this).
- Payments record a successful pay action in the response (no live Stripe keys).
- Webhooks POST JSON on submit; a down endpoint does not fail the response.
- Team invites are stored in the workspace (no outbound email provider).

## Original work

Original implementation of the assignment. Not copied from another Typeform clone.
