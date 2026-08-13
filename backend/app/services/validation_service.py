import re

from app.core.constants import RATING_VALUES, YES_NO_OPTIONS
from app.models import Question

EMAIL_PATTERN = re.compile(r"^[^\s@]+@[^\s@]+\.[^\s@]+$")


def validate_answer(question: Question, value: str) -> str | None:
    answer = (value or "").strip()
    if question.required and not answer:
        return f"{question.title} is required"
    if not answer:
        return None
    if question.type == "email" and not EMAIL_PATTERN.match(answer):
        return "Please enter a valid email address"
    if question.type == "number":
        try:
            float(answer)
        except ValueError:
            return "Please enter a number"
    if question.type in {"multiple_choice", "dropdown"} and answer not in question.options:
        return "Please choose a valid option"
    if question.type == "yes_no" and answer not in YES_NO_OPTIONS:
        return "Please choose Yes or No"
    if question.type == "rating" and answer not in RATING_VALUES:
        return "Please choose a rating from 1 to 5"
    if question.type == "payment" and question.required and not answer.startswith("Paid"):
        return "Please complete the payment to continue"
    return None


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
