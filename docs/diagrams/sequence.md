# Sequence diagrams

## 1. Create + build + save

```mermaid
sequenceDiagram
  actor Creator
  participant Dash as DashboardView
  participant API as formsApi
  participant Route as POST/PUT /api/forms
  participant Svc as FormService
  participant DB as SQLite

  Creator->>Dash: Click Create form
  Dash->>API: POST /forms {title, first question}
  API->>Route: JSON
  Route->>Svc: create()
  Svc->>DB: INSERT form + question + activity created
  Svc-->>Dash: FormDefinition
  Dash->>Creator: Navigate /builder/{id}
  Creator->>Dash: Edit canvas, drag reorder, Save
  Dash->>API: PUT /forms/{id}
  API->>Svc: update() + sync questions by id
  Svc->>DB: UPDATE questions + stamp updated_by + activity saved
  Svc-->>Creator: Saved toast
```

## 1b. Live editors + live save sync

```mermaid
sequenceDiagram
  actor A as Teammate A
  actor B as Teammate B
  participant BA as useBuilder A
  participant BB as useBuilder B
  participant API as /api/forms/{id}
  participant Collab as CollaborationService
  participant DB as SQLite

  loop every 4 seconds
    BA->>API: POST /presence A
    BB->>API: POST /presence B
    API->>Collab: heartbeat
    Collab->>DB: UPSERT form_presence
    Collab-->>BA: editors includes B (not A)
    BA-->>A: pill "B editing"
    BA->>API: GET /forms/{id}
  end
  B->>BB: Save
  BB->>API: PUT form + actor B
  API->>DB: updated_at, updated_by, form_activity
  BA->>API: GET /forms/{id}
  Note over BA: remote updated_at changed and A is not dirty — not live typing
  BA-->>A: toast "B just saved" + apply saved form
  A->>BA: Close builder
  BA->>API: DELETE /presence
  API->>Collab: leave
  Collab->>DB: DELETE form_presence for A
```

## 2. Publish and share

```mermaid
sequenceDiagram
  actor Creator
  participant Builder
  participant API as POST /forms/{id}/publish
  participant Svc as FormService
  participant DB as SQLite

  Creator->>Builder: Publish
  Builder->>API: toggle
  API->>Svc: status draft → published + actor
  Svc->>DB: UPDATE status, updated_by, activity published
  Svc-->>Builder: slug
  Creator->>Builder: Copy link
  Note over Creator: origin/f/{slug} — no auth
```

## 3. Respondent fill + submit (no login)

```mermaid
sequenceDiagram
  actor Respondent
  participant UI as PublicFormView
  participant Hook as useRespondent
  participant Pub as publicFormsApi
  participant Route as /api/public/{slug}
  participant Val as validation_service
  participant Svc as ResponseService
  participant DB as SQLite
  participant HookUrl as webhook_service

  Respondent->>UI: Open /f/{slug}
  UI->>Pub: GET /public/{slug}
  Pub->>Route: require_public
  alt draft or missing
    Route-->>UI: 404
  else published
    Route-->>UI: form + questions + theme
    UI->>Respondent: Welcome → Start
    loop each question
      Respondent->>Hook: answer
      Hook->>Pub: POST /partial
      Pub->>DB: UPSERT partial_responses
      Respondent->>Hook: Enter / OK / choice
      Hook->>Hook: client validateAnswer()
    end
    Hook->>Pub: POST /responses
    Pub->>Val: reachable_questions + validate
    Val-->>Svc: ok or 422
    Svc->>DB: INSERT response + answers
    Svc->>DB: DELETE partial
    Svc->>HookUrl: POST webhook_url (best effort)
    Svc-->>UI: {id}
    UI->>Respondent: Thank-you screen
  end
```

## 4. Results

```mermaid
sequenceDiagram
  actor Creator
  participant Results as ResultsView
  participant API as formsApi

  Creator->>Results: Open Results tab
  Results->>API: GET /forms/{id}/responses
  Results->>API: GET /forms/{id}/stats
  API-->>Results: rows + choice counts + completion %
  Creator->>Results: Click a row
  Results->>Creator: Response detail modal
  Creator->>Results: Export CSV
  Results->>API: GET /forms/{id}/responses.csv
```

## 5. Invite teammate (email + copy link)

```mermaid
sequenceDiagram
  actor Owner
  actor Invitee
  participant Team as TeamView
  participant API as /api/workspace/invites
  participant Mail as email_service
  participant Accept as /invite/{token}

  Owner->>Team: Name, email, role → Send invite
  Team->>API: POST invite
  API-->>Team: accept_url immediately
  Team-->>Owner: Copy invite link
  API--)Mail: SMTP in background
  alt Railway blocks 587/465
    Mail-->>API: email_error set
    Team-->>Owner: toast + still copy the link
  else SMTP ok
    Mail-->>Invitee: branded HTML + plaintext
  end
  Invitee->>Accept: Open link, set password
  Accept-->>Invitee: JWT — now a member
```
