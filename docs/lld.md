# Low-level design (LLD)

## 1. Goal

Formly is a Typeform-style product with two hard surfaces:

1. **Creator builder** — ordered questions, live canvas, publish.
2. **Public respondent flow** — one question at a time, keyboard, validation, no login.

## 2. Runtime flow

```
Browser page
  → View (React component)
    → Hook (useForms / useBuilder / useRespondent)
      → lib/api.ts  (fetch JSON)
        → FastAPI route
          → Service (rules)
            → Repository (SQL)
              → SQLite
```

Public fill never touches creator-only screens. It only calls `/api/public/{slug}`.

## 3. Backend modules

| Module | Responsibility |
|---|---|
| `FormService` | create, update (sync questions by id), rename, duplicate, publish toggle, stamp `updated_by`, serialize |
| `ResponseService` | submit, partial save, stats, CSV rows, file upload |
| `validation_service` | required / email / number / choice / payment; logic-jump path walk |
| `webhook_service` | fire-and-forget POST on submit |
| `TeamService` | invite / list / remove workspace members |
| `CollaborationService` | presence heartbeat, active editors, activity log |
| `seed.py` | two published forms + responses + owner/editor members |

**Question sync rule:** `PUT /api/forms/{id}` does **not** delete-all-and-recreate. Existing question IDs are updated in place so historical `answers.question_id` stay valid.

**Submit rule:** only questions on the *reachable path* (after logic jumps) are required. Skipped questions are not 422.

## 4. Frontend modules

| Hook | Screen | API |
|---|---|---|
| `useCurrentUser` | sidebar + builder | pick teammate identity (per tab) |
| `useForms` | dashboard | list, create, rename, duplicate, publish, delete + actor |
| `useBuilder` | `/builder/[id]` | get, update, publish, heartbeat, poll remote saves |
| `useRespondent` | `/f/[slug]` | public get, partial, submit, upload |
| TeamView | `/team` | members CRUD |
| ActivityLog | Settings tab | who saved / published / renamed |

Builder tabs: **Build** (list + canvas + settings) · **Results** · **Settings**.

Respondent steps: `loading → welcome → question* → thanks | error`.

## 5. API map

### Creator (`/api/forms`)

| Method | Path | Use |
|---|---|---|
| GET | `/api/forms` | workspace list |
| POST | `/api/forms` | create |
| GET | `/api/forms/{id}` | builder load |
| PUT | `/api/forms/{id}` | save definition + theme + webhook |
| PATCH | `/api/forms/{id}` | rename |
| DELETE | `/api/forms/{id}` | delete cascade |
| POST | `/api/forms/{id}/duplicate` | copy as draft |
| POST | `/api/forms/{id}/publish` | draft ↔ published |
| GET | `/api/forms/{id}/responses` | table |
| GET | `/api/forms/{id}/stats` | counts + completion |
| GET | `/api/forms/{id}/responses.csv` | export |
| POST | `/api/forms/{id}/presence` | I am editing (heartbeat) |
| GET | `/api/forms/{id}/presence` | who is editing now |
| GET | `/api/forms/{id}/activity` | who saved / modified |

### Public (no auth)

| Method | Path | Use |
|---|---|---|
| GET | `/api/public/{slug}` | published form only |
| POST | `/api/public/{slug}/partial` | in-progress answers |
| POST | `/api/public/{slug}/responses` | final submit |
| POST | `/api/public/{slug}/upload` | file question |

### Workspace

| Method | Path | Use |
|---|---|---|
| GET/POST | `/api/workspace/members` | list / invite |
| DELETE | `/api/workspace/members/{id}` | remove (not owner) |

## 6. Question types

`short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`, `file_upload`, `payment`.

Logic jumps apply to choice / yes-no / dropdown: a list of `{ option, target_id, end }`.

## 7. Persistence

SQLite file `backend/typeform.db`. JSON columns: `theme`, `options`, `logic`, partial `answers`. Cascades: deleting a form deletes questions, responses, answers, partials, presence, and activity.

## 8. Auth assumption

Assignment allows a default logged-in creator. There is one workspace. Public fill has **zero** auth.

## 9. Live collaboration

| Mechanism | How |
|---|---|
| Who is editing now | `POST /api/forms/{id}/presence` heartbeat every 4s; editors with `last_seen` &lt; 20s shown in the builder |
| Who saved / modified | `form.updated_by` + `form_activity` log (created, saved, renamed, published) |
| Live changes | Other open builders poll `GET /forms/{id}`; if `updated_at` changed and local is clean, the form reloads automatically |

Identity is chosen from workspace members (per browser tab) because real login is optional in the brief.
