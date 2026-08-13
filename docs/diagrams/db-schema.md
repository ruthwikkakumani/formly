# Database schema (ER)

SQLite file created on boot (local `backend/typeform.db`, production `/data/typeform.db`). Not baked into the Docker image.

```mermaid
erDiagram
  forms ||--|{ questions : has
  forms ||--o{ responses : collects
  forms ||--o{ partial_responses : tracks
  forms ||--o{ form_presence : editors
  forms ||--o{ form_activity : history
  responses ||--|{ answers : contains
  questions ||--o{ answers : answered_as

  forms {
    int id PK
    string title
    text description
    string status
    string slug UK
    string webhook_url
    string updated_by
    string updated_by_email
    json theme
    datetime created_at
    datetime updated_at
  }

  questions {
    int id PK
    int form_id FK
    int position
    string type
    text title
    text description
    bool required
    json options
    json logic
  }

  responses {
    int id PK
    int form_id FK
    datetime submitted_at
  }

  answers {
    int id PK
    int response_id FK
    int question_id FK
    text value
  }

  partial_responses {
    int id PK
    int form_id FK
    string visitor_id UK
    json answers
    datetime updated_at
  }

  workspace_members {
    int id PK
    string name
    string email UK
    string role
    string password_hash
    datetime created_at
  }

  workspace_invites {
    int id PK
    string token UK
    string name
    string email
    string role
    string status
    datetime expires_at
  }

  form_presence {
    int id PK
    int form_id FK
    string name
    string email
    datetime last_seen
  }

  form_activity {
    int id PK
    int form_id FK
    string actor_name
    string actor_email
    string action
    text detail
    datetime created_at
  }
```

## Constraints and rules

| Rule | Why |
|---|---|
| `forms.slug` unique + indexed | public URL `/f/{slug}` |
| `forms.status` in `{draft, published}` | unpublished forms 404 on public API |
| `forms.updated_by` | last person who saved / published / renamed |
| `questions.position` ordered | builder + respondent order |
| `questions.options` JSON | MC / dropdown / payment amount+currency |
| `questions.logic` JSON | `{ rules: [{ option, target_id, end }] }` |
| `forms.theme` JSON | colors, font, thankYou, darkMode |
| `partial_responses.visitor_id` unique | one in-progress blob per browser |
| `form_presence (form_id, email)` unique | one live editor row per person per form |
| `form_presence.last_seen` | drop from UI if older than 20 seconds |
| `form_activity.action` | `created`, `saved`, `renamed`, `published`, `draft`, `duplicated` |
| ON DELETE CASCADE from form | deleting a form wipes children including presence/activity |
| Question update by id | saving the builder does not orphan historical answers |

## Indexes

- `forms.slug`
- `questions.form_id`
- `responses.form_id`
- `answers.response_id`, `answers.question_id`
- `partial_responses.form_id`, `partial_responses.visitor_id`
- `workspace_members.email`
- `form_presence.form_id`, `form_presence.email`
- `form_activity.form_id`
