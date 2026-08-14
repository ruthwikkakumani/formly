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

Layered flow: **route → service → repository → SQLite**. Routes own HTTP only. Services own rules. Repositories own SQL.

| Module | Responsibility |
|---|---|
| `FormRepository` / `ResponseRepository` / `MemberRepository` / `InviteRepository` / `PasswordResetRepository` / `CollaborationRepository` | SQLAlchemy queries and persist helpers |
| `FormService` | create, update (sync questions by id), rename, duplicate, publish toggle, stamp `updated_by`, serialize |
| `ResponseService` | submit, partial save/load, combined results, stats, CSV export, file upload |
| `validation_service` | required / email / number / choice / payment via a type→validator map; logic-jump path walk |
| `webhook_service` | fire-and-forget POST on submit |
| `AuthService` | register (first **owner** only; later registers 403 — seeded reviewer does not count as owner), login, JWT, profile/password, forgot + reset token |
| `TeamService` | list members; update role viewer ↔ editor (owner only); remove (owner only — cannot remove the owner) |
| `InviteService` | pending email invites + accept URL; create/list/revoke are owner-only; accept creates a real account |
| `email_service` | SMTP (or Resend) invite and reset mail off the request thread; invite copy link still works if SMTP is blocked |
| `CollaborationService` | presence heartbeat, leave (DELETE row), active editors, activity log |
| `seed.py` | two published forms + one draft + sample responses; demo members from env (`OWNER_*`, `REVIEWER_*`, `VIEWER_*`) |
| `AppError` | domain errors; `main.py` maps them to `{ "detail": ... }` HTTP responses |

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
| `ResultsView` | builder Results tab | `GET /forms/{id}/results` → donut + legend for choices, rating columns, open-text snippets + wrapping table + CSV |
| `useRespondent` | `/f/[slug]` | public get, restore draft (`fillDraft` + `GET /partial`), save partial, submit, upload |
| TeamView | `/team` and `/settings#team` | members; owner-only invite + role dropdown (viewer ↔ editor) + copy link even when email fails |
| SettingsWorkspace | `/settings` | right-side Account / Password / Team buttons; one panel at a time |
| AccountSettings | `/settings` | change display name (`PATCH /auth/me`) and password (`POST /auth/password`) |
| Login page | `/login` | JWT login; shows assignment reviewer email/password + fill button |
| Forgot / reset pages | `/forgot-password`, `/reset/[token]` | request token; set new password |
| ActivityLog | builder Settings tab | who saved / published / renamed |
| `lib/errors.ts` | all surfaces | situation-specific copy (auth, invite, timeout, network, SMTP) |
| `lib/access.ts` | team / settings / builder | `isOwner()`, `isViewer()`, `canEditForms()` |

Builder tabs: **Build** (sortable list + canvas + question editor) · **Results** (donut/rating insight cards + wrapping table + CSV) · **Settings** (form description textarea, theme, thank-you, webhook, activity).

Workspace shell: **Home** · **Workspace** (`/team`) · **Settings** (`/settings`).

Respondent steps: `loading → welcome → question* → thanks | error`. A refresh restores `question` (and answers) from `localStorage` plus `GET /api/public/{slug}/partial` when a visitor id exists. After submit, that browser tab shows thank-you (`sessionStorage`); a later visit can start a new response.

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
| GET | `/api/forms/{id}/results` | responses + stats in one payload (Results tab poll) |
| GET | `/api/forms/{id}/responses.csv` | export |
| POST | `/api/forms/{id}/presence` | I am editing (heartbeat every 4s) |
| DELETE | `/api/forms/{id}/presence` | leave builder — row is removed |
| GET | `/api/forms/{id}/presence` | who is editing now |
| GET | `/api/forms/{id}/activity` | who saved / modified |

### Public (no auth)

| Method | Path | Use |
|---|---|---|
| GET | `/api/public/{slug}` | published form only |
| GET | `/api/public/{slug}/partial?visitor_id=` | restore in-progress answers |
| POST | `/api/public/{slug}/partial` | upsert in-progress answers |
| POST | `/api/public/{slug}/responses` | final submit |
| POST | `/api/public/{slug}/upload` | file question |

### Auth (JWT)

| Method | Path | Use |
|---|---|---|
| GET | `/api/auth/demo` | seeded demo logins from env (owner / reviewer / viewer) for the sign-in page |
| POST | `/api/auth/register` | first **owner** account; 403 if an owner already exists |
| POST | `/api/auth/login` | email + password → token |
| GET | `/api/auth/me` | current user |
| PATCH | `/api/auth/me` | update display name |
| POST | `/api/auth/password` | change password (requires current password) |
| POST | `/api/auth/forgot-password` | create 1-hour reset token; send email (best effort). Always returns a generic ok message. Locally also returns `reset_url` |
| GET | `/api/auth/reset-password/{token}` | preview open token (email + expiry) |
| POST | `/api/auth/reset-password/{token}` | set password; issue JWT |

### Workspace (Bearer token)

| Method | Path | Use |
|---|---|---|
| GET | `/api/workspace/members` | accepted members (any signed-in member) |
| GET/POST | `/api/workspace/invites` | pending invites / send email + return copy link (**owner only**) |
| DELETE | `/api/workspace/invites/{id}` | revoke (**owner only**) |
| GET | `/api/invites/{token}` | public preview |
| POST | `/api/invites/{token}/accept` | set password; only then a member is created |
| PATCH | `/api/workspace/members/{id}` | change role to `editor` or `viewer` (**owner only**; cannot change the owner) |
| DELETE | `/api/workspace/members/{id}` | remove teammate (**owner only**; cannot remove the owner) |

Form mutations (create, save, rename, delete, duplicate, publish) require **owner** or **editor**. **Viewer** gets 403: "You have view-only access. Ask the owner to make you an editor." Reads (list, get, results, stats, CSV, activity, presence) stay open to every signed-in member. Public `/f/{slug}` stays unauthenticated.

## 6. Question types

`short_text`, `long_text`, `multiple_choice`, `dropdown`, `email`, `number`, `yes_no`, `rating`, `file_upload`, `payment` (records `"Paid …"` — no Stripe).

Logic jumps apply to choice / yes-no / dropdown: a list of `{ option, target_id, end }`.

Starter templates (dashboard Templates tab): Product feedback, Customer interview, Event RSVP, Remote work pulse, NPS & satisfaction, Contact & leads.

## 7. Persistence

SQLite file created on boot.

| Environment | Path | Notes |
|---|---|---|
| Local | `backend/typeform.db` | `DATABASE_URL=sqlite:///./typeform.db` |
| Railway | `/data/typeform.db` | volume at `/data`; `DATABASE_URL=sqlite:////data/typeform.db` (four slashes); `UPLOAD_DIR=/data/uploads` |

SQLite opens with WAL + `busy_timeout=5000` and a 30s connect timeout so concurrent builder saves and public partials do not lock each other out.

The Docker image does not ship a `.db` file. JSON columns: `theme`, `options`, `logic`, partial `answers`. Cascades: deleting a form deletes questions, responses, answers, partials, presence, and activity. `password_resets` is a separate table (token, member_id, 1-hour expiry); it is not a form child.

## 8. Auth assumption

Creators sign in with email/password (JWT). First register is owner; others join only by accepting an invite as `editor` (can edit forms) or `viewer` (read-only until the owner changes their role). Public fill has **zero** auth. Forgot-password tokens live in `password_resets` (1 hour, single use).

Assignment graders use the seeded reviewer (`REVIEWER_EMAIL` / `REVIEWER_PASSWORD`, defaults `reviewer@formly.dev` / `FormlyReview1`). That account is an editor (can edit forms; cannot invite/remove), not the owner, and is not a Gmail. `/login` displays the credentials (`NEXT_PUBLIC_REVIEWER_EMAIL` / `NEXT_PUBLIC_REVIEWER_PASSWORD`).

## 9. Live collaboration

Not Google Docs. No WebSockets, no OT/CRDT, no character-level sync.

| Mechanism | How |
|---|---|
| Who is editing now | `POST /api/forms/{id}/presence` every 4s; editors with `last_seen` within 8s shown in the builder. You never see yourself. |
| Leave | `DELETE /api/forms/{id}/presence` on `pagehide` / `beforeunload` / unmount — row is deleted immediately |
| Who saved / modified | `form.updated_by` + `form_activity` log (created, saved, renamed, published) |
| Live changes | Other open builders poll `GET /forms/{id}`; if `updated_at` changed and local is clean, the form reloads. Dirty local gets a toast to save or reload. |

Identity is the signed-in JWT account. Heartbeats stamp that name/email; you cannot spoof another teammate from the client.

Question list reorder uses `@dnd-kit` (`DndContext` + `SortableContext` + `DragOverlay`, `animateLayoutChanges`). Dragging a question over another **slides neighbors to open a gap**; drop commits `onReorder`; Escape / cancel restores the list. Overlay follows the pointer; movement is vertical-axis only.

## 10. Errors and timeouts

`frontend/lib/api.ts` aborts hung fetches after 8 seconds. `frontend/lib/errors.ts` maps status and network failures to short, professional copy (wrong password, invite expired, SMTP blocked → copy the link, timeout, and so on). The backend returns the same kind of `detail` strings rather than stack traces.
