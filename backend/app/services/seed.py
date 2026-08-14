from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.constants import THEME_DEFAULTS
from app.core.security import hash_password
from app.models import Answer, Form, Member, Question, Response
from app.repositories.form_repository import FormRepository
from app.repositories.member_repository import MemberRepository

_members = MemberRepository()
_forms = FormRepository()


def seed_account(db: Session, *, email: str, password: str, role: str, name: str) -> None:
    email = (email or "").strip().lower()
    password = password or ""
    if not email or len(password) < 8:
        return
    member = _members.get_by_email(db, email)
    hashed = hash_password(password)
    if member:
        member.password_hash = hashed
        member.role = role
        if not (member.name or "").strip():
            member.name = name
    else:
        _members.add(db, Member(name=name, email=email, role=role, password_hash=hashed))
    db.commit()


def seed_demo_accounts(db: Session) -> None:
    seed_account(
        db,
        email=settings.owner_email,
        password=settings.owner_password,
        role="owner",
        name="Owner",
    )
    seed_account(
        db,
        email=settings.reviewer_email,
        password=settings.reviewer_password,
        role="editor",
        name="Reviewer",
    )
    seed_account(
        db,
        email=settings.viewer_email,
        password=settings.viewer_password,
        role="viewer",
        name="Viewer",
    )


def seed_database(db: Session) -> None:
    seed_demo_accounts(db)
    if _forms.has_any(db):
        return

    feedback = Form(
        title="Product feedback",
        description="Help us shape the next release. This takes about two minutes.",
        status="published",
        slug="product-feedback",
        theme={**THEME_DEFAULTS, "accent": "#6558f5"},
        questions=[
            Question(position=0, type="short_text", title="What should we call you?", required=True),
            Question(
                position=1,
                type="email",
                title="What's the best email for follow-ups?",
                required=True,
            ),
            Question(
                position=2,
                type="multiple_choice",
                title="How would you rate your experience so far?",
                options=["Amazing", "Good", "Okay", "Needs work"],
                required=True,
            ),
            Question(
                position=3,
                type="number",
                title="How many times a week do you use the product?",
                required=True,
            ),
            Question(
                position=4,
                type="long_text",
                title="What could we improve?",
                description="Your honest feedback helps us prioritize.",
            ),
        ],
    )
    pulse = Form(
        title="Remote work pulse",
        description="A quick check-in for distributed teams.",
        status="published",
        slug="remote-work-pulse",
        theme={**THEME_DEFAULTS, "background": "#f3f1ea", "accent": "#0445af"},
        questions=[
            Question(position=0, type="email", title="What is your work email?", required=True),
            Question(
                position=1,
                type="dropdown",
                title="How often do you work remotely?",
                options=["Every day", "A few days a week", "Occasionally", "Never"],
                required=True,
            ),
            Question(
                position=2,
                type="rating",
                title="How satisfied are you with your setup?",
                required=True,
            ),
            Question(
                position=3,
                type="yes_no",
                title="Would you recommend remote work here?",
                required=True,
                logic={"option": "No", "target_id": None, "end": True},
            ),
            Question(
                position=4,
                type="long_text",
                title="Anything we should know about your setup?",
            ),
        ],
    )
    draft = Form(
        title="New customer interview",
        description="Draft interview script — not published yet.",
        status="draft",
        slug="customer-interview",
        theme=dict(THEME_DEFAULTS),
        questions=[
            Question(position=0, type="short_text", title="Who are we speaking with?", required=True),
            Question(position=1, type="yes_no", title="Have they used a competitor before?"),
        ],
    )
    db.add_all([feedback, pulse, draft])
    db.flush()

    first = Response(form_id=feedback.id)
    second = Response(form_id=feedback.id)
    third = Response(form_id=pulse.id)
    db.add_all([first, second, third])
    db.flush()
    db.add_all(
        [
            Answer(response_id=first.id, question_id=feedback.questions[0].id, value="Maya Chen"),
            Answer(response_id=first.id, question_id=feedback.questions[1].id, value="maya@example.com"),
            Answer(response_id=first.id, question_id=feedback.questions[2].id, value="Amazing"),
            Answer(response_id=first.id, question_id=feedback.questions[3].id, value="4"),
            Answer(response_id=first.id, question_id=feedback.questions[4].id, value="The onboarding felt effortless."),
            Answer(response_id=second.id, question_id=feedback.questions[0].id, value="Jordan Lee"),
            Answer(response_id=second.id, question_id=feedback.questions[1].id, value="jordan@example.com"),
            Answer(response_id=second.id, question_id=feedback.questions[2].id, value="Good"),
            Answer(response_id=second.id, question_id=feedback.questions[3].id, value="2"),
            Answer(response_id=third.id, question_id=pulse.questions[0].id, value="alex@example.com"),
            Answer(response_id=third.id, question_id=pulse.questions[1].id, value="Every day"),
            Answer(response_id=third.id, question_id=pulse.questions[2].id, value="5"),
            Answer(response_id=third.id, question_id=pulse.questions[3].id, value="Yes"),
        ]
    )
    db.commit()


