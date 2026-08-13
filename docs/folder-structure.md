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
│   ├── Dockerfile
│   ├── render.yaml
│   ├── .env.example
│   └── app/
│       ├── core/                  settings, question-type constants
│       │   ├── config.py
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
│       │   └── member.py
│       ├── schemas/               Pydantic request/response contracts
│       │   ├── form.py
│       │   ├── question.py
│       │   ├── submission.py
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
│       │   └── seed.py
│       └── api/
│           ├── router.py          mounts route modules
│           ├── deps.py            shared service instances
│           └── routes/
│               ├── health.py
│               ├── forms.py       creator CRUD, publish, results, CSV
│               ├── public.py      unauthenticated fill + upload
│               └── team.py        workspace members
└── frontend/                      Next.js 15 App Router
    ├── app/
    │   ├── layout.tsx             fonts + global CSS
    │   ├── page.tsx               dashboard (thin)
    │   ├── team/page.tsx          collaboration
    │   ├── builder/[id]/page.tsx  builder (thin)
    │   └── f/[slug]/page.tsx      public fill (thin, no auth)
    ├── components/
    │   ├── layout/                WorkspaceShell, AppHeader
    │   ├── dashboard/             form cards, rename modal
    │   ├── builder/               canvas, list, settings, logic
    │   ├── results/               table, modal, stats
    │   ├── settings/              theme, thank-you, webhook
    │   ├── respondent/            welcome, question, thank-you
    │   ├── team/                  invite + member list
    │   └── shared/                Toast, Modal, StatusBadge
    ├── hooks/                     useForms, useBuilder, useRespondent, useToast
    ├── lib/                       api client, types, validation, constants
    └── styles/                    dashboard, builder, respondent, results, settings
```

## Why this layout

| Layer | Owns | Must not own |
|---|---|---|
| `app/` pages | routing only | fetch, form state, CSS layout |
| `components/` | UI | HTTP URLs, SQL |
| `hooks/` | client state + calling `lib/api` | JSX layout |
| `lib/api.ts` | HTTP | React |
| `api/routes` | HTTP status + wiring | SQL queries |
| `services/` | validation, publish, submit, webhooks | FastAPI `Request` objects |
| `repositories/` | SQLAlchemy queries | HTTP / validation messages |
| `models/` | tables + relationships | API JSON shape |
| `schemas/` | request/response DTOs | database sessions |
