# Database schema (ER)

SQLite file: `backend/typeform.db`. Designed for this product (not copied from Typeform).

```mermaid
erDiagram
  forms ||--|{ questions : has
  forms ||--o{ responses : collects
  forms ||--o{ partial_responses : tracks
  responses ||--|{ answers : contains
  questions ||--o{ answers : answered_as

  forms {
    int id PK
    string title
    text description
    string status
    string slug UK
    string webhook_url
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
    datetime created_at
  }
```

## Constraints and rules

| Rule | Why |
|---|---|
| `forms.slug` unique + indexed | public URL `/f/{slug}` |
| `forms.status` in `{draft, published}` | unpublished forms 404 on public API |
| `questions.position` ordered | builder + respondent order |
| `questions.options` JSON | MC / dropdown / payment amount+currency |
| `questions.logic` JSON | `{ rules: [{ option, target_id, end }] }` |
| `forms.theme` JSON | colors, font, thankYou, darkMode |
| `partial_responses.visitor_id` unique | one in-progress blob per browser |
| ON DELETE CASCADE from form | deleting a form wipes children |
| Question update by id | saving the builder does not orphan historical answers |

## Indexes

- `forms.slug`
- `questions.form_id`
- `responses.form_id`
- `answers.response_id`, `answers.question_id`
- `partial_responses.form_id`, `partial_responses.visitor_id`
- `workspace_members.email`
