# Class / UML diagram

## Domain (SQLAlchemy)

```mermaid
classDiagram
  class Form {
    +int id
    +str title
    +str description
    +str status
    +str slug
    +str webhook_url
    +dict theme
    +datetime created_at
    +datetime updated_at
  }
  class Question {
    +int id
    +int form_id
    +int position
    +str type
    +str title
    +str description
    +bool required
    +list options
    +dict logic
  }
  class Response {
    +int id
    +int form_id
    +datetime submitted_at
  }
  class Answer {
    +int id
    +int response_id
    +int question_id
    +str value
  }
  class PartialResponse {
    +int id
    +int form_id
    +str visitor_id
    +dict answers
    +datetime updated_at
  }
  class Member {
    +int id
    +str name
    +str email
    +str role
    +datetime created_at
  }
  Form "1" --> "*" Question : questions
  Form "1" --> "*" Response : responses
  Form "1" --> "*" PartialResponse : partials
  Response "1" --> "*" Answer : answers
  Question "1" --> "*" Answer : answers
```

## Application services

```mermaid
classDiagram
  class FormRepository {
    +get(db, id)
    +get_public(db, slug)
    +list(db)
  }
  class ResponseRepository {
    +list_for_form(db, id)
    +get_partial(db, visitor_id)
    +count_partials(db, form_id)
  }
  class FormService {
    +serialize(form)
    +create(db, payload)
    +update(db, id, payload)
    +duplicate(db, id)
    +toggle_publish(db, id)
    -_sync_questions(db, form, payload)
  }
  class ResponseService {
    +submit(db, slug, payload)
    +save_partial(db, slug, payload)
    +stats(db, form_id)
    +store_upload(db, slug, file)
  }
  class TeamService {
    +list(db)
    +invite(db, payload)
    +remove(db, id)
  }
  FormService --> FormRepository
  ResponseService --> FormService
  ResponseService --> ResponseRepository
```

## Frontend (React)

```mermaid
classDiagram
  class DashboardView
  class BuilderView
  class PublicFormView
  class TeamView
  class useForms
  class useBuilder
  class useRespondent
  class formsApi
  class publicFormsApi
  class teamApi
  DashboardView --> useForms
  BuilderView --> useBuilder
  PublicFormView --> useRespondent
  TeamView --> teamApi
  useForms --> formsApi
  useBuilder --> formsApi
  useRespondent --> publicFormsApi
```
