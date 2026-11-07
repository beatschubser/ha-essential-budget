"""Budget data: default content and validation. No Home Assistant imports (tested with tests/test_logic.py).

File format (essential_budget.json), amounts in the currency of Home Assistant with cents:

{
  "version": 1,
  "persons": {"a": "Alex", "b": "Sam"},   (an empty name for "b" = budget of one person)
  "income": [{"name": "Salary", "person": "a", "amount": 3150.0}],
  "shared_income": [{"name": "Child benefit", "to": "a", "amount": 518.0}],
  "fixed_costs": [{"name": "Rent", "category": "Home", "person": "a", "amount": 1480.0, "payments_per_year": 12}],
  "annual_gross": [{"name": "Gross salary Alex", "amount": 58000.0}],
  "bonuses": [{"name": "Annual bonus", "amount": 3200.0}]
}

- income: net income per month of one person
- shared_income: income of both (e.g. child benefit); "to" = the person whose account receives it
- fixed_costs: amount per payment, paid "payments_per_year" times a year (1 to 12); "person" pays it
- annual_gross, bonuses: free yearly values (bonuses are net and part of the annual gross)
"""

from __future__ import annotations

import math
from typing import Any

FILE_VERSION = 1
PERSONS = ("a", "b")
DEFAULT_PERSON_NAME = "Person A"  # the first person always has a name; the second one is optional

MAX_ITEMS = 300  # per list
MAX_NAME = 80
MAX_CATEGORY = 40
MAX_PERSON_NAME = 40
MAX_AMOUNT = 100_000_000

# Fields of every list, in the order they are written to the file
LISTS = {
    "income": ("name", "person", "amount"),
    "shared_income": ("name", "to", "amount"),
    "fixed_costs": ("name", "category", "person", "amount", "payments_per_year"),
    "annual_gross": ("name", "amount"),
    "bonuses": ("name", "amount"),
}


class BudgetError(ValueError):
    """Invalid budget data; the message names the place, e.g. 'fixed_costs 3: amount'."""


def default_data(name_a: str = "", name_b: str = "") -> dict[str, Any]:
    """Empty budget for a new installation (without name_b for one person)."""
    return {
        "version": FILE_VERSION,
        "persons": {"a": " ".join(name_a.split()) or DEFAULT_PERSON_NAME, "b": " ".join(name_b.split())},
        **{key: [] for key in LISTS},
    }


def active_persons(data: dict[str, Any]) -> tuple[str, ...]:
    """("a",) for one person, ("a", "b") for two."""
    return PERSONS if data["persons"].get("b") else ("a",)


def _text(value: Any, where: str, max_length: int) -> str:
    if value is None:
        return ""
    if not isinstance(value, str):
        raise BudgetError(f"{where}: text expected")
    value = " ".join(value.split())  # trim, no line breaks or double spaces
    if len(value) > max_length:
        raise BudgetError(f"{where}: longer than {max_length} characters")
    return value


def _amount(value: Any, where: str) -> float:
    """A number with at most two decimals (cents). Strings like '1.234,56' are not accepted: the card sends numbers."""
    if isinstance(value, bool) or not isinstance(value, (int, float)) or not math.isfinite(value):
        raise BudgetError(f"{where}: number expected")
    if value < 0 or value > MAX_AMOUNT:
        raise BudgetError(f"{where}: must be between 0 and {MAX_AMOUNT}")
    return round(float(value), 2)


def _person(value: Any, where: str, persons: tuple[str, ...]) -> str:
    if value not in persons:
        raise BudgetError(f"{where}: must be {' or '.join(persons)}" + ("" if len(persons) > 1 else " (no second person)"))
    return value


def _payments(value: Any, where: str) -> int:
    if isinstance(value, bool) or not isinstance(value, (int, float)) or value != int(value) or not 1 <= value <= 12:
        raise BudgetError(f"{where}: whole number from 1 to 12 expected")
    return int(value)


def _item(list_key: str, raw: Any, index: int, persons: tuple[str, ...]) -> dict[str, Any] | None:
    """One cleaned entry, or None for an empty row (no name and no amount)."""
    where = f"{list_key} {index + 1}"
    if not isinstance(raw, dict):
        raise BudgetError(f"{where}: object expected")
    name = _text(raw.get("name"), f"{where}: name", MAX_NAME)
    amount = raw.get("amount")
    if not name and amount in (None, "", 0):
        return None
    if not name:
        raise BudgetError(f"{where}: name missing")
    item: dict[str, Any] = {"name": name}
    for field in LISTS[list_key][1:]:
        value = raw.get(field)
        if field == "amount":
            item[field] = _amount(0 if value in (None, "") else value, f"{where}: amount")
        elif field in ("person", "to"):
            item[field] = _person(value, f"{where}: {field}", persons)
        elif field == "category":
            item[field] = _text(value, f"{where}: category", MAX_CATEGORY)
        elif field == "payments_per_year":
            item[field] = _payments(12 if value is None else value, f"{where}: payments_per_year")
    return item


def validate(data: Any) -> dict[str, Any]:
    """Check budget data (from the card or the file) and return a cleaned copy.

    Names are trimmed, empty rows dropped, amounts rounded to cents, unknown keys removed.
    Raises BudgetError with the place of the first problem.
    """
    if not isinstance(data, dict):
        raise BudgetError("object expected")
    persons_raw = data.get("persons")
    if persons_raw is None:
        persons_raw = {}
    if not isinstance(persons_raw, dict):
        raise BudgetError("persons: object expected")
    persons = {
        "a": _text(persons_raw.get("a"), "persons: a", MAX_PERSON_NAME) or DEFAULT_PERSON_NAME,
        "b": _text(persons_raw.get("b"), "persons: b", MAX_PERSON_NAME),
    }
    result: dict[str, Any] = {"version": FILE_VERSION, "persons": persons}
    active = active_persons(result)
    for key in LISTS:
        raw_list = data.get(key)
        if raw_list is None:
            raw_list = []
        if not isinstance(raw_list, list):
            raise BudgetError(f"{key}: list expected")
        if len(raw_list) > MAX_ITEMS:
            raise BudgetError(f"{key}: more than {MAX_ITEMS} entries")
        result[key] = [item for i, raw in enumerate(raw_list) if (item := _item(key, raw, i, active)) is not None]
    return result


def monthly(cost: dict[str, Any]) -> float:
    """Monthly share of a fixed cost (yearly costs count with a twelfth)."""
    return cost["amount"] * cost["payments_per_year"] / 12


def totals(data: dict[str, Any]) -> dict[str, Any]:
    """Monthly sums as shown in the card (exact values, rounding happens only for display)."""
    persons = active_persons(data)
    income = {p: sum(i["amount"] for i in data["income"] if i["person"] == p) for p in persons}
    shared = {p: sum(i["amount"] for i in data["shared_income"] if i["to"] == p) for p in persons}
    costs = {p: sum(monthly(c) for c in data["fixed_costs"] if c["person"] == p) for p in persons}
    income_total = sum(income.values()) + sum(shared.values())
    costs_total = sum(costs.values())
    return {
        "income": income_total,
        "fixed_costs": costs_total,
        "budget": income_total - costs_total,
        "budget_per_person": {p: income[p] + shared[p] - costs[p] for p in persons},
    }
