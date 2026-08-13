# Activity diagrams

## Creator: build and publish

```mermaid
flowchart TD
  A[Open workspace] --> B[Create, use a template, or open form]
  B --> C[Edit title and questions]
  C --> D{Need another question?}
  D -->|Yes| E[Add type / drag reorder]
  E --> C
  D -->|No| F[Toggle required / help / logic]
  F --> G[Save]
  G --> G2[Stamp updated_by + write form_activity]
  G2 --> H{Publish?}
  H -->|No| I[Remain draft]
  H -->|Yes| J[status = published]
  J --> K[Copy /f/slug]
  I --> L[Done]
  K --> L
```

## Respondent: one question at a time

```mermaid
flowchart TD
  A[Open share link] --> B{Form published?}
  B -->|No| Z[Error screen]
  B -->|Yes| C[Welcome]
  C --> D[Show question N]
  D --> E[Type or choose answer]
  E --> F[Save partial]
  F --> G{Client valid?}
  G -->|No| H[Show validation]
  H --> E
  G -->|Yes| I{Logic jump?}
  I -->|Target question| D
  I -->|End or last| J[POST /responses]
  J --> K{Server valid?}
  K -->|No| H
  K -->|Yes| L[Store answers]
  L --> M[Fire webhook]
  M --> N[Thank-you]
```

## Two teammates editing the same form

```mermaid
flowchart TD
  A[Open builder as member A] --> B[Heartbeat every 4s]
  C[Open builder as member B] --> D[Heartbeat every 4s]
  B --> E[GET presence]
  D --> E
  E --> F{Other last_seen < 8s?}
  F -->|Yes| G[Show "X editing"]
  F -->|No| H[Show Only you]
  B --> I[Poll GET form]
  I --> J{updated_at changed?}
  J -->|No| B
  J -->|Yes dirty local| K[Toast: teammate saved newer version]
  J -->|Yes clean local| L[Apply saved remote form]
  B --> M[Close or navigate away]
  M --> N[DELETE /presence]
```
