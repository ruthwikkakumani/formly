# Component and deployment diagrams

## Component diagram

```mermaid
flowchart LR
  subgraph Browser
    Pages[Next.js pages]
    Views[Feature views]
    Hooks[Hooks including useCurrentUser]
    Client[lib/api.ts]
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
  Client -->|presence heartbeat 4s| Routes
  Models --> SQLite[(typeform.db on volume)]
  Services -->|invite email| SMTP[SMTP or Resend]
  Services -->|optional POST| Webhook[Creator webhook URL]
  Routes -->|/uploads| Disk[uploads/]
```

## Deployment

```mermaid
flowchart TB
  User[Respondent or Creator]
  CF[Cloudflare DNS rdrt.dev]
  Web[Railway formly-frontend]
  API[Railway formly-backend]
  Vol[(Volume /data SQLite + uploads)]

  User --> CF
  CF --> Web
  CF --> API
  Web -->|NEXT_PUBLIC_API_URL| API
  User -->|/f/slug no auth| Web
  API --> Vol
```

Images: `ruthwikkakumani/formly-frontend` and `ruthwikkakumani/formly-backend`.  
CORS allows localhost, `*.up.railway.app`, and `*.rdrt.dev`.
