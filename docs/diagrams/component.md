# Component and deployment diagrams

## Component diagram

```mermaid
flowchart LR
  subgraph Browser
    Pages[Next.js pages]
    Views[Feature views + Templates]
    Hooks[Hooks including useCurrentUser]
    Client["lib/api.ts 8s timeout"]
    Pages --> Views --> Hooks --> Client
  end

  subgraph FastAPI
    Routes[api/routes]
    Services[Auth Invite Form Response Team Collab]
    Repos[repositories]
    Models[SQLAlchemy models]
    Routes --> Services --> Repos --> Models
  end

  Client -->|REST JSON /api + JWT| Routes
  Client -->|presence heartbeat 4s / leave DELETE| Routes
  Models --> SQLite[("/data/typeform.db")]
  Services -->|invite email best effort| SMTP[Gmail SMTP or Resend]
  Services -->|optional POST| Webhook[Creator webhook URL]
  Routes -->|UPLOAD_DIR| Disk["/data/uploads"]
```

Invite email is best-effort. If Railway cannot reach SMTP (ports 587/465 often blocked), the invite row still exists and the creator copies the accept link.

## Deployment

```mermaid
flowchart TB
  User[Respondent or Creator]
  CF[Cloudflare DNS rdrt.dev]
  Web[Railway formly-frontend]
  API[Railway formly-backend]
  Vol[("Volume /data — SQLite + uploads")]

  User --> CF
  CF --> Web
  CF --> API
  Web -->|NEXT_PUBLIC_API_URL| API
  User -->|/f/slug no auth| Web
  API --> Vol
```

Images: `ruthwikkakumani/formly-frontend` and `ruthwikkakumani/formly-backend`.

Live: [https://formly.rdrt.dev](https://formly.rdrt.dev) · API [https://formly-api.rdrt.dev](https://formly-api.rdrt.dev)

Two Railway services. Backend volume mount **`/data`**.

| Variable | Value |
|---|---|
| `DATABASE_URL` | `sqlite:////data/typeform.db` (four slashes) |
| `UPLOAD_DIR` | `/data/uploads` |
| `CORS_ORIGINS` | `https://formly.rdrt.dev` — no quotes |
| `FRONTEND_URL` | `https://formly.rdrt.dev` |
| `NEXT_PUBLIC_API_URL` | `https://formly-api.rdrt.dev/api` |

CORS also allows localhost, `*.up.railway.app`, and `*.rdrt.dev`.
