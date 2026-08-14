from collections.abc import Callable

from app.core.constants import RATING_VALUES, YES_NO_OPTIONS
from app.models import Question
from app.schemas.member import EMAIL_PATTERN

Validator = Callable[[Question, str], str | None]


def _email(question: Question, answer: str) -> str | None:
    if not EMAIL_PATTERN.match(answer):
        return "Please enter a valid email address"
    return None


def _number(question: Question, answer: str) -> str | None:
    try:
        float(answer)
    except ValueError:
        return "Please enter a number"
    return None


def _choice(question: Question, answer: str) -> str | None:
    if answer not in (question.options or []):
        return "Please choose a valid option"
    return None


def _yes_no(question: Question, answer: str) -> str | None:
    if answer not in YES_NO_OPTIONS:
        return "Please choose Yes or No"
    return None


def _rating(question: Question, answer: str) -> str | None:
    if answer not in RATING_VALUES:
        return "Please choose a rating from 1 to 5"
    return None


def _payment(question: Question, answer: str) -> str | None:
    if question.required and not answer.startswith("Paid"):
        return "Please complete the payment to continue"
    return None


VALIDATORS: dict[str, Validator] = {
    "email": _email,
    "number": _number,
    "multiple_choice": _choice,
    "dropdown": _choice,
    "yes_no": _yes_no,
    "rating": _rating,
    "payment": _payment,
}


def validate_answer(question: Question, value: str) -> str | None:
    answer = (value or "").strip()
    if question.required and not answer:
        return f"{question.title} is required"
    if not answer:
        return None
    validator = VALIDATORS.get(question.type)
    return validator(question, answer) if validator else None


def _logic_rules(logic: dict) -> list[dict]:
    if logic.get("rules"):
        return list(logic["rules"])
    if logic.get("option"):
        return [logic]
    return []


def next_question_index(questions: list[Question], current: int, value: str) -> int | None:
    question = questions[current]
    for rule in _logic_rules(question.logic or {}):
        if rule.get("option") != value:
            continue
        if rule.get("end"):
            return None
        target_id = rule.get("target_id")
        if target_id not in (None, ""):
            for index, item in enumerate(questions):
                if item.id == int(target_id):
                    return index
        target = rule.get("target")
        if target not in (None, ""):
            index = int(target)
            if 0 <= index < len(questions):
                return index
    nxt = current + 1
    return nxt if nxt < len(questions) else None


def reachable_questions(questions: list[Question], incoming: dict[int, str]) -> list[Question]:
    index: int | None = 0
    visited: list[Question] = []
    seen: set[int] = set()
    while index is not None and index not in seen:
        seen.add(index)
        question = questions[index]
        visited.append(question)
        index = next_question_index(questions, index, incoming.get(question.id, ""))
    return visited
