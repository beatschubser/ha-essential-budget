"""Budget data: default content and validation (the card does the calculation).

No Home Assistant imports (tested with tests/test_logic.py).

File format (.storage/essential_budget.json), amounts in the currency of Home Assistant with cents:

{
  "version": 1,
  "persons": {"a": "Alex", "b": "Sam"},   (an empty name for "b" = budget of one person)
  "colors": {"a": "#2f6fde"},              (optional color per person)
  "income": [{"name": "Salary", "person": "a", "gross": 4800.0, "amount": 3150.0}],
  "special_payments": [{"name": "Christmas bonus", "person": "a", "gross": 3400.0}],
  "shared_income": [{"name": "Child benefit", "to": "a", "amount": 518.0}],
  "fixed_costs": [{"name": "Rent", "category": "Home", "person": "a", "amount": 1480.0, "interval_months": 1}]
}

- income: monthly income of one person, "amount" = net, "gross" = gross (optional)
- special_payments: once a year (bonus, Christmas bonus), only "gross"; not part of the monthly income,
  only of the annual gross
- annual gross of a person = 12 × gross of the income + gross of the special payments
- shared_income: income of both (e.g. child benefit); "to" = the person whose account receives it
- fixed_costs: amount per payment, paid every "interval_months" months (1 = monthly, 3 = quarterly,
  12 = yearly, up to 120); "person" pays it.
"""

from __future__ import annotations

import math
import re
from collections.abc import Callable
from typing import Any

FILE_VERSION = 1
PERSONS = ("a", "b")
DEFAULT_PERSON_NAME = "Person A"  # the first person always has a name; the second one is optional

MAX_ITEMS = 300  # per list
MAX_NAME = 80
MAX_CATEGORY = 40
MAX_PERSON_NAME = 40
MAX_AMOUNT = 100_000_000
MAX_INTERVAL = 120  # months between two payments of a fixed cost
COLOR = re.compile(r"^#[0-9a-fA-F]{6}$")

# Sent to the card, so that its fields have the same limits (WebSocket command "version")
LIMITS = {
    "name": MAX_NAME,
    "category": MAX_CATEGORY,
    "person_name": MAX_PERSON_NAME,
    "interval": MAX_INTERVAL,
}


class BudgetError(ValueError):
    """Invalid budget data; the message names the place, e.g. 'fixed_costs 3: amount'."""


def clean_name(value: str) -> str:
    """Trimmed, without line breaks or double spaces."""
    return " ".join(value.split())


# ---------------------------------------------------------------------------
# Checks for single values: each returns the cleaned value or raises BudgetError.
# All take (value, where, persons), so that every field of a list can be checked the same way.
# ---------------------------------------------------------------------------


def _text(value: Any, where: str, max_length: int) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        raise BudgetError(f"{where}: text expected")
    value = clean_name(value)
    if len(value) > max_length:
        raise BudgetError(f"{where}: longer than {max_length} characters")
    return value


def _name(value: Any, where: str, persons: tuple[str, ...]) -> str:
    return _text(value, where, MAX_NAME)


def _category(value: Any, where: str, persons: tuple[str, ...]) -> str:
    return _text(value, where, MAX_CATEGORY)


def _amount(value: Any, where: str, persons: tuple[str, ...] = ()) -> float:
    """A number with at most two decimals (cents); empty counts as 0.

    Strings like '1.234,56' are not accepted: the card sends numbers.
    """
    if value in (None, ""):
        return 0.0
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise BudgetError(f"{where}: number expected")
    if value < 0 or value > MAX_AMOUNT:
        raise BudgetError(f"{where}: must be between 0 and {MAX_AMOUNT}")
    return round(float(value), 2)


def _optional_amount(value: Any, where: str, persons: tuple[str, ...]) -> float | None:
    """Like _amount, but an empty value means: not set (the field is left out)."""
    return None if value in (None, "") else _amount(value, where)


def _person(value: Any, where: str, persons: tuple[str, ...]) -> str:
    if value not in persons:
        raise BudgetError(f"{where}: must be {' or '.join(persons)}" + ("" if len(persons) > 1 else " (no second person)"))
    return value


def _interval(value: Any, where: str, persons: tuple[str, ...]) -> int:
    if value is None:
        return 1
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value != int(value) or not 1 <= value <= MAX_INTERVAL:
        raise BudgetError(f"{where}: whole number from 1 to {MAX_INTERVAL} expected")
    return int(value)


Check = Callable[[Any, str, tuple[str, ...]], Any]

# Fields of every list in the order they are written to the file, each with its check.
# A check that returns None leaves the field out (optional fields).
LISTS: dict[str, dict[str, Check]] = {
    "income": {"name": _name, "person": _person, "gross": _optional_amount, "amount": _amount},
    "special_payments": {"name": _name, "person": _person, "gross": _amount},
    "shared_income": {"name": _name, "to": _person, "amount": _amount},
    "fixed_costs": {"name": _name, "category": _category, "person": _person, "amount": _amount, "interval_months": _interval},
}


def default_data(name_a: str = "", name_b: str = "") -> dict[str, Any]:
    """Empty budget for a new installation (without name_b for one person)."""
    return {
        "version": FILE_VERSION,
        "persons": {"a": clean_name(name_a) or DEFAULT_PERSON_NAME, "b": clean_name(name_b)},
        **{key: [] for key in LISTS},
    }


def active_persons(data: dict[str, Any]) -> tuple[str, ...]:
    """("a",) for one person, ("a", "b") for two."""
    return PERSONS if data["persons"].get("b") else ("a",)


def _item(list_key: str, raw: Any, index: int, persons: tuple[str, ...]) -> dict[str, Any] | None:
    """One cleaned entry, or None for an empty row (no name and no amount)."""
    where = f"{list_key} {index + 1}"
    if not isinstance(raw, dict):
        raise BudgetError(f"{where}: object expected")
    if not _name(raw.get("name"), f"{where}: name", persons):
        if all(raw.get(field) in (None, "", 0) for field in ("amount", "gross")):
            return None
        raise BudgetError(f"{where}: name missing")
    item: dict[str, Any] = {}
    for field, check in LISTS[list_key].items():
        value = check(raw.get(field), f"{where}: {field}", persons)
        if value is not None:
            item[field] = value
    return item


def _persons(raw: Any) -> dict[str, str]:
    if raw is None:
        raw = {}
    if not isinstance(raw, dict):
        raise BudgetError("persons: object expected")
    return {
        "a": _text(raw.get("a"), "persons: a", MAX_PERSON_NAME) or DEFAULT_PERSON_NAME,
        "b": _text(raw.get("b"), "persons: b", MAX_PERSON_NAME),
    }


def _colors(raw: Any) -> dict[str, str]:
    """Own colors of the persons; only persons with a color are returned."""
    if not raw:
        return {}
    if not isinstance(raw, dict):
        raise BudgetError("colors: object expected")
    colors = {}
    for person in PERSONS:
        color = raw.get(person)
        if color in (None, ""):
            continue
        if not isinstance(color, str) or not COLOR.match(color):
            raise BudgetError(f"colors: {person}: color like #2f6fde expected")
        colors[person] = color.lower()
    return colors


def _list(key: str, raw: Any, persons: tuple[str, ...]) -> list[dict[str, Any]]:
    if raw is None:
        raw = []
    if not isinstance(raw, list):
        raise BudgetError(f"{key}: list expected")
    if len(raw) > MAX_ITEMS:
        raise BudgetError(f"{key}: more than {MAX_ITEMS} entries")
    return [item for index, entry in enumerate(raw) if (item := _item(key, entry, index, persons)) is not None]


def validate(data: Any) -> dict[str, Any]:
    """Check budget data (from the card or the file) and return a cleaned copy.

    Names are trimmed, empty rows dropped, amounts rounded to cents, unknown keys removed.
    Raises BudgetError with the place of the first problem.
    """
    if not isinstance(data, dict):
        raise BudgetError("object expected")
    result: dict[str, Any] = {"version": FILE_VERSION, "persons": _persons(data.get("persons"))}
    if colors := _colors(data.get("colors")):  # optional, only written when set
        result["colors"] = colors
    persons = active_persons(result)
    for key in LISTS:
        result[key] = _list(key, data.get(key), persons)
    return result
