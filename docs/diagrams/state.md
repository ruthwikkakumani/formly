# State machine diagrams

## Form lifecycle

```mermaid
stateDiagram-v2
  [*] --> Draft: POST /forms
  Draft --> Draft: PUT save / rename / reorder
  Draft --> Published: POST /publish
  Published --> Draft: POST /publish again
  Published --> Published: PUT save
  Draft --> [*]: DELETE
  Published --> [*]: DELETE
```

Published is the only state where `GET /api/public/{slug}` succeeds.

## Respondent session

```mermaid
stateDiagram-v2
  [*] --> Loading: open /f/slug
  Loading --> Error: 404
  Loading --> Welcome: published form
  Welcome --> Question: Start or Enter
  Question --> Question: next / back / jump
  Question --> Thanks: submit 200
  Question --> Question: 422 stay + message
  Error --> [*]
  Thanks --> [*]
```

`useRespondent` step enum: `loading | error | welcome | question | thanks`.

## Question row while editing

```mermaid
stateDiagram-v2
  [*] --> NewLocal: add in builder no id yet
  NewLocal --> Persisted: Save PUT assigns id
  Persisted --> Persisted: edit fields / position
  Persisted --> [*]: delete question
```

Logic jump targets only include questions that already have an `id` (saved once).

## Editor presence

```mermaid
stateDiagram-v2
  [*] --> Offline
  Offline --> Active: POST /presence
  Active --> Active: heartbeat every 4s
  Active --> Stale: no heartbeat for 8s
  Stale --> [*]: row deleted
  Active --> [*]: DELETE /presence on leave
```

## Builder local draft vs remote

```mermaid
stateDiagram-v2
  [*] --> Clean: GET form
  Clean --> Dirty: local edit
  Dirty --> Clean: Save PUT
  Clean --> Clean: teammate save auto-applied
  Dirty --> Conflict: teammate saved while dirty
  Conflict --> Clean: Save or reload
```

## Password reset token

```mermaid
stateDiagram-v2
  [*] --> Open: POST /forgot-password
  Open --> Used: POST /reset-password
  Open --> Expired: after 1 hour
  Open --> Superseded: newer reset for same member
  Used --> [*]
  Expired --> [*]
  Superseded --> [*]
```

## Question list drag

```mermaid
stateDiagram-v2
  [*] --> Idle
  Idle --> Dragging: pointer past 6px
  Dragging --> Dragging: over another row; neighbors slide to open gap
  Dragging --> Idle: drop commits new order
  Dragging --> Idle: Escape cancels
```
