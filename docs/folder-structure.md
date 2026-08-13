# Folder structure

```
formly/
├── README.md                      product overview + links to this design pack
├── COMMANDS.md                    local run, GitHub, deploy commands
├── .gitignore
├── docs/                          LLD, UML, sequence, ER, states
│   ├── README.md
│   ├── lld.md
│   ├── folder-structure.md
│   └── diagrams/
│       ├── use-case.md
│       ├── class-uml.md
│       ├── sequence.md
│       ├── activity.md
│       ├── state.md
│       ├── db-schema.md
│       └── component.md
├── backend/                       FastAPI + SQLite
│   ├── main.py                    composition root (CORS, lifespan, seed, mounts)
│   ├── requirements.txt
│   ├── Dockerfile                 DATABASE_URL=sqlite:////data/typeform.db
│   ├── render.yaml
│   ├── .env.example
│   └── app/
│       ├── core/                  settings, security, constants
│       │   ├── config.py
│       │   ├── security.py
│       │   └── constants.py
│       ├── db/                    engine, session, declarative Base
│       │   ├── base.py
│       │   └── session.py
│       ├── models/                SQLAlchemy tables
│       │   ├── form.py
│       │   ├── question.py
│       │   ├── response.py
│       │   ├── answer.py
│       │   ├── partial_response.py
│       │   ├── member.py
│       │   ├── invite.py
│       │   ├── presence.py
│       │   └── activity.py
│       ├── schemas/               Pydantic request/response contracts
│       │   ├── form.py
│       │   ├── question.py
│       │   ├── submission.py
│       │   ├── auth.py
│       │   └── member.py
│       ├── repositories/          SQL only
│       │   ├── form_repository.py
│       │   └── response_repository.py
│       ├── services/              business rules
│       │   ├── form_service.py
│       │   ├── response_service.py
│       │   ├── validation_service.py
│       │   ├── webhook_service.py
│       │   ├── team_service.py
│       │   ├── auth_service.py
│       │   ├── invite_service.py
│       │   ├── email_service.py
│       │   ├── collaboration_service.py
│       │   └── seed.py
│       └── api/
│           ├── router.py          mounts route modules
│           ├── deps.py            JWT current user
│           └── routes/
│               ├── health.py
│               ├── auth.py        register / login / me
│               ├── forms.py       creator CRUD + presence leave (auth required)
│               ├── public.py      unauthenticated fill + upload
│               ├── invites.py     send / preview / accept
│               └── team.py        members
└── frontend/                      Next.js 15 App Router
    ├── app/
    │   ├── layout.tsx             fonts + global CSS
    │   ├── page.tsx               dashboard (thin)
    │   ├── login/page.tsx
    │   ├── register/page.tsx
    │   ├── invite/[token]/page.tsx
    │   ├── team/page.tsx          collaboration
    │   ├── builder/[id]/page.tsx  builder (thin)
    │   └── f/[slug]/page.tsx      public fill (thin, no auth)
    ├── components/
    │   ├── layout/                WorkspaceShell, AppHeader
    │   ├── dashboard/             form cards, rename modal, TemplatesGallery
    │   ├── builder/               canvas, list, settings, logic, ActivityLog
    │   ├── results/               table, modal, stats
    │   ├── settings/              theme, thank-you, webhook
    │   ├── respondent/            welcome, question, thank-you
    │   ├── team/                  invite + copy link + member list
    │   └── shared/                Toast, Modal, StatusBadge
    ├── hooks/                     useForms, useBuilder, useRespondent, useToast, useCurrentUser
    ├── lib/                       api client (8s timeout), auth token, types, validation, templates, errors
    └── styles/                    dashboard, builder, respondent, results, settings
```

## Why this layout

| Layer | Owns | Must not own |
|---|---|---|
| `app/` pages | routing only | fetch, form state, CSS layout |
| `components/` | UI | HTTP URLs, SQL |
| `hooks/` | client state + calling `lib/api` | JSX layout |
| `lib/api.ts` | HTTP + timeout | React |
| `lib/errors.ts` | user-facing copy from status / network | fetch |
| `lib/templates.ts` | starter-kit payloads | HTTP |
| `api/routes` | HTTP status + wiring | SQL queries |
| `services/` | validation, publish, submit, webhooks, invites | FastAPI `Request` objects |
| `repositories/` | SQLAlchemy queries | HTTP / validation messages |
| `models/` | tables + relationships | API JSON shape |
| `schemas/` | request/response DTOs | database sessions |
