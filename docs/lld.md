# Low-level design (LLD)

## 1. Goal

Formly is a Typeform-style product with two hard surfaces:

1. **Creator builder** — ordered questions, live canvas, publish.
2. **Public respondent flow** — one question at a time, keyboard, validation, no login.

Auth is extra to the assignment: the first `/register` is the workspace owner; everyone after that joins only by accepting an invite. Public `/f/{slug}` never asks for a login.

## 2. Runtime flow

```
Browser page
  → View (React component)
    → Hook (useForms / useBuilder / useRespondent)
      → lib/api.ts  (fetch JSON, 8s timeout)
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
| `AuthService` | register (first user = owner; later registers 403), login, JWT |
| `TeamService` | list / remove accepted members |
| `InviteService` | pending email invites + accept URL; accept creates a real account |
| `email_service` | SMTP (or Resend) invite mail off the request thread; copy link still works if SMTP is blocked |
| `CollaborationService` | presence heartbeat, leave (DELETE row), active editors, activity log |
| `seed.py` | two published forms + one draft + sample responses. **No fake members.** |

**Question sync rule:** `PUT /api/forms/{id}` does **not** delete-all-and-recreate. Existing question IDs are updated in place so historical `answers.question_id` stay valid.

**Submit rule:** only questions on the *reachable path* (after logic jumps) are required. Skipped questions are not 422.

**Invite rule:** creating an invite always returns `accept_url`. Email is best-effort. Railway often cannot reach Gmail on 587/465; the UI tells the creator to copy the link.

## 4. Frontend modules

| Hook / view | Screen | API |
|---|---|---|
| `useCurrentUser` | sidebar + builder | JWT `/auth/me` — signed-in account, not a per-tab picker |
| `useForms` | dashboard | list, create, rename, duplicate, publish, delete + **create from template** |
| `TemplatesGallery` | dashboard Templates tab | starter kits → `POST /forms` |
| `useBuilder` | `/builder/[id]` | get, update, publish, heartbeat, leave, poll remote saves |
| `useRespondent` | `/f/[slug]` | public get, partial, submit, upload |
| TeamView | `/team` | members + invites; copy link even when email fails |
| ActivityLog | Settings tab | who saved / published / renamed |
| `lib/errors.ts` | all surfaces | situation-specific copy (auth, invite, timeout, network) |

Builder tabs: **Build** (list + canvas + settings) · **Results** · **Settings**.

Respondent steps: `loading → welcome → question* → thanks | error`.

## 5. API map

### Creator (`/api/forms`)

| Method | Path | Use |
|---|---|---|
| GET | `/api/forms` | workspace list |
| POST | `/api/forms` | create (blank or from a template payload) |
| GET | `/api/forms/{id}` | builder load |
| PUT | `/api/forms/{id}` | save definition + theme + webhook |
| PATCH | `/api/forms/{id}` | rename |
| DELETE | `/api/forms/{id}` | delete cascade |
| POST | `/api/forms/{id}/duplicate` | copy as draft |
| POST | `/api/forms/{id}/publish` | draft ↔ published |
| GET | `/api/forms/{id}/responses` | table |
| GET | `/api/forms/{id}/stats` | counts + completion |
| GET | `/api/forms/{id}/responses.csv` | export |
| POST | `/api/forms/{id}/presence` | I am editing (heartbeat every 4s) |
| DELETE | `/api/forms/{id}/presence` | leave builder — row is removed |
| GET | `/api/forms/{id}/presence` | who is editing now |
| GET | `/api/forms/{id}/activity` | who saved / modified |

### Public (no auth)

| Method | Path | Use |
|---|---|---|
| GET | `/api/public/{slug}` | published form only |
| POST | `/api/public/{slug}/partial` | in-progress answers |
| POST | `/api/public/{slug}/responses` | final submit |
| POST | `/api/public/{slug}/upload` | file question |

### Auth (JWT)

| Method | Path | Use |
|---|---|---|
| POST | `/api/auth/register` | first account becomes owner; later calls 403 |
| POST | `/api/auth/login` | email + password → token |
| GET | `/api/auth/me` | current user |

### Workspace (Bearer token)

| Method | Path | Use |
|---|---|---|
| GET | `/api/workspace/members` | accepted members |
| GET/POST | `/api/workspace/invites` | pending invites / send email + return copy link |
| DELETE | `/api/workspace/invites/{id}` | revoke |
| GET | `/api/invites/{token}` | public preview |
| POST | `/api/invites/{token}/accept` | set password; only then a member is created |
| DELETE | `/api/workspace/members/{id}` | remove (not owner) |

## 6. Question types

`short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`, `file_upload`, `payment`.

Logic jumps apply to choice / yes-no / dropdown: a list of `{ option, target_id, end }`.

Starter templates (dashboard Templates tab): Product feedback, Customer interview, Event RSVP, Remote work pulse, NPS & satisfaction, Contact & leads.

## 7. Persistence

SQLite file created on boot.

| Environment | Path | Notes |
|---|---|---|
| Local | `backend/typeform.db` | `DATABASE_URL=sqlite:///./typeform.db` |
| Railway | `/data/typeform.db` | volume at `/data`; `DATABASE_URL=sqlite:////data/typeform.db` (four slashes); `UPLOAD_DIR=/data/uploads` |

The Docker image does not ship a `.db` file. JSON columns: `theme`, `options`, `logic`, partial `answers`. Cascades: deleting a form deletes questions, responses, answers, partials, presence, and activity.

## 8. Auth assumption

Creators sign in with email/password (JWT). First register is owner; others join only by accepting an invite. Public fill has **zero** auth.

## 9. Live collaboration

Not Google Docs. No WebSockets, no character-level sync.

| Mechanism | How |
|---|---|
| Who is editing now | `POST /api/forms/{id}/presence` every 4s; editors with `last_seen` within 8s shown in the builder. You never see yourself. |
| Leave | `DELETE /api/forms/{id}/presence` on `pagehide` / `beforeunload` / unmount — row is deleted immediately |
| Who saved / modified | `form.updated_by` + `form_activity` log (created, saved, renamed, published) |
| Live changes | Other open builders poll `GET /forms/{id}`; if `updated_at` changed and local is clean, the form reloads. Dirty local gets a toast to save or reload. |

Identity is the signed-in JWT account. Heartbeats stamp that name/email; you cannot spoof another teammate from the client.

## 10. Errors and timeouts

`frontend/lib/api.ts` aborts hung fetches after 8 seconds. `frontend/lib/errors.ts` maps status and network failures to short, professional copy (wrong password, invite expired, SMTP blocked → copy the link, timeout, and so on). The backend returns the same kind of `detail` strings rather than stack traces.
