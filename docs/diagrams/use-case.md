# Use case diagram

Actors: **Creator / teammate** (workspace member) and **Respondent** (anonymous, shareable link).

```mermaid
flowchart TB
  subgraph Actors
    C((Creator))
    T((Teammate))
    R((Respondent))
  end

  subgraph Workspace
    UC1[Create form]
    UC2[Rename / duplicate / delete form]
    UC3[Build questions DnD]
    UC4[Configure theme thank-you webhook]
    UC5[Publish / unpublish]
    UC6[Copy share link]
    UC7[View results and stats]
    UC8[Export CSV]
    UC9[Invite by email]
    UC17[Accept invite / sign in]
    UC14[See who is editing live]
    UC15[See who last saved]
    UC16[View activity history]
  end

  subgraph PublicFill
    UC10[Open published form]
    UC11[Answer one question at a time]
    UC12[Validate client and server]
    UC13[Submit and see thank-you]
  end

  C --> UC1
  C --> UC2
  C --> UC3
  C --> UC4
  C --> UC5
  C --> UC6
  C --> UC7
  C --> UC8
  C --> UC9
  C --> UC17
  C --> UC14
  C --> UC15
  C --> UC16
  T --> UC3
  T --> UC14
  T --> UC15
  T --> UC16
  R --> UC10
  R --> UC11
  UC11 --> UC12
  UC12 --> UC13
  UC5 -.->|generates slug /f/slug| UC10
```

### Use case notes

| ID | Actor | Precondition | Postcondition |
|---|---|---|---|
| Create form | Creator | Workspace open | Draft form with one question, builder opens |
| Build questions | Creator / teammate | Form loaded | Ordered questions persisted on Save; `updated_by` set |
| Live presence | Anyone in builder | Heartbeat every 4s | Others see “X editing” |
| Activity history | Creator / teammate | Form exists | Settings shows saved / renamed / published log |
| Publish | Creator | Form has ≥1 question | `status=published`, public GET works |
| Fill | Respondent | Form published | Response + answers stored; partial cleared |
| Invite | Creator | Signed-in owner/editor | Pending invite + email; no member yet |
| Accept invite | Invitee | Valid token | Account + member created; JWT issued |
