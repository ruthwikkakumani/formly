# Activity diagrams

## Sign in (including assignment reviewer)

```mermaid
flowchart TD
  A[Open /login] --> B{Have an account?}
  B -->|Reviewer demo| C[Use shown reviewer@formly.dev credentials]
  B -->|Owner or teammate| D[Enter email and password]
  C --> E[POST /auth/login]
  D --> E
  E --> F[JWT session]
  B -->|First owner| G[Open /register]
  G --> H[POST /auth/register as owner]
```

## Creator: build and publish

```mermaid
flowchart TD
  A[Open workspace] --> B[Create, use a template, or open form]
  B --> C[Edit title and questions]
  C --> D{Need another question?}
  D -->|Yes| E[Add type / drag over to open gap]
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
  F -->|Yes| G[Show teammate editing]
  F -->|No| H[Show Only you]
  B --> I[Poll GET form]
  I --> J{updated_at changed?}
  J -->|No| B
  J -->|Yes dirty local| K[Toast: teammate saved newer version]
  J -->|Yes clean local| L[Apply saved remote form]
  B --> M[Close or navigate away]
  M --> N[DELETE /presence]
```

## Owner invites a teammate

```mermaid
flowchart TD
  A[Open Workspace or Settings] --> B{Signed-in owner?}
  B -->|No| C[See members only]
  B -->|Yes| D[Name, email, editor or viewer]
  D --> E[POST /workspace/invites]
  E --> F[Show copy invite link]
  E --> G[SMTP in background]
  G --> H{Railway SMTP blocked?}
  H -->|Yes| I[email_error set; copy link still works]
  H -->|No| J[Invitee gets email]
  F --> K[Invitee opens /invite/token]
  J --> K
  K --> L[Set password]
  L --> M[Member created; can edit forms]
```

## Forgot password

```mermaid
flowchart TD
  A[Open /forgot-password] --> B[POST /auth/forgot-password]
  B --> C{Email in workspace?}
  C -->|No| D[Same generic ok message]
  C -->|Yes| E[Create 1h password_resets row]
  E --> F[Send reset email]
  F --> G{SMTP ok?}
  G -->|No| H[Token still valid; professional error]
  G -->|Yes| I[Inbox link]
  D --> J[Done]
  H --> J
  I --> K[Open /reset/token]
  K --> L[POST new password]
  L --> M[Signed in]
```
