"""Tests for logic.py without Home Assistant: python3 tests/test_logic.py (or pytest)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "custom_components" / "essential_budget"))

from logic import BudgetError, default_data, monthly, totals, validate  # noqa: E402

SAMPLE = {
    "persons": {"a": "  Alex ", "b": "Sam"},
    "income": [
        {"name": "Salary", "person": "a", "amount": 3150, "annual_gross": 58000},
        {"name": "Side job", "person": "a", "amount": 450.004},
        {"name": "Salary", "person": "b", "amount": 2480},
        {"name": "", "person": "b", "amount": 0},  # empty row: dropped
    ],
    "shared_income": [{"name": "Child benefit", "to": "a", "amount": 518}],
    "fixed_costs": [
        {"name": "Rent", "category": "Home", "person": "a", "amount": 1480, "payments_per_year": 12},
        {"name": "Liability", "category": "Insurance", "person": "b", "amount": 89, "payments_per_year": 1},
        {"name": "Broadcasting fee", "category": "  Home ", "person": "b", "amount": 55.08, "payments_per_year": 4},
    ],
    "annual_gross": [{"name": "Gross Alex", "amount": 58000}],
    "bonuses": [{"name": "Bonus", "amount": 3200}],
    "unknown": "dropped",
}


def test_validate_cleans() -> None:
    data = validate(SAMPLE)
    assert data["version"] == 1
    assert data["persons"] == {"a": "Alex", "b": "Sam"}
    assert len(data["income"]) == 3
    assert data["income"][1]["amount"] == 450.0
    assert data["income"][0]["annual_gross"] == 58000.0
    assert "annual_gross" not in data["income"][1]  # optional, not written when empty
    assert "annual_gross" not in validate({"income": [{"name": "X", "person": "a", "amount": 1, "annual_gross": ""}]})["income"][0]
    assert data["fixed_costs"][2]["category"] == "Home"
    assert "unknown" not in data
    assert list(data["fixed_costs"][0]) == ["name", "category", "person", "amount", "payments_per_year"]
    assert validate(data) == data  # stable


def test_defaults() -> None:
    data = default_data("", " Sam ")
    assert data["persons"] == {"a": "Person A", "b": "Sam"}
    assert validate(data) == data
    assert validate({})["persons"]["a"] == "Person A"
    # payments_per_year defaults to monthly, category may be empty
    cost = validate({"fixed_costs": [{"name": "X", "person": "a", "amount": 10}]})["fixed_costs"][0]
    assert cost == {"name": "X", "category": "", "person": "a", "amount": 10.0, "payments_per_year": 12}


def test_one_person() -> None:
    data = validate({"persons": {"a": "Alex", "b": " "}, "income": [{"name": "Salary", "person": "a", "amount": 100}]})
    assert data["persons"] == {"a": "Alex", "b": ""}
    assert totals(data)["budget_per_person"] == {"a": 100}
    try:
        validate({"persons": {"a": "Alex"}, "fixed_costs": [{"name": "X", "person": "b", "amount": 1}]})
    except BudgetError as err:
        assert "fixed_costs 1: person" in str(err) and "no second person" in str(err)
    else:
        raise AssertionError("cost of a missing second person accepted")


def test_invalid() -> None:
    cases = [
        ({"income": [{"name": "X", "person": "c", "amount": 1}]}, "income 1: person"),
        ({"income": [{"name": "", "person": "a", "amount": 5}]}, "income 1: name missing"),
        ({"fixed_costs": [{"name": "X", "person": "a", "amount": 1, "payments_per_year": 13}]}, "payments_per_year"),
        ({"fixed_costs": [{"name": "X", "person": "a", "amount": 1, "payments_per_year": 2.5}]}, "payments_per_year"),
        ({"bonuses": [{"name": "X", "amount": -1}]}, "bonuses 1: amount"),
        ({"bonuses": [{"name": "X", "amount": "12"}]}, "bonuses 1: amount"),
        ({"bonuses": [{"name": "X", "amount": True}]}, "bonuses 1: amount"),
        ({"shared_income": [{"name": "X", "amount": 1}]}, "shared_income 1: to"),
        ({"bonuses": {}}, "bonuses: list"),
        ({"income": [{"name": "X", "person": "a", "amount": 1, "annual_gross": -5}]}, "income 1: annual_gross"),
        ([], "object expected"),
    ]
    for data, expected in cases:
        try:
            validate(data)
        except BudgetError as err:
            assert expected in str(err), (expected, str(err))
        else:
            raise AssertionError(f"accepted: {data}")


def test_totals() -> None:
    data = validate(SAMPLE)
    assert monthly(data["fixed_costs"][1]) == 89 / 12
    t = totals(data)
    assert t["income"] == 3150 + 450 + 2480 + 518
    costs = 1480 + 89 / 12 + 55.08 * 4 / 12
    assert abs(t["fixed_costs"] - costs) < 1e-9
    assert abs(t["budget"] - (t["income"] - costs)) < 1e-9
    assert t["budget_per_person"]["a"] == 3150 + 450 + 518 - 1480
    assert abs(t["budget_per_person"]["b"] - (2480 - 89 / 12 - 55.08 * 4 / 12)) < 1e-9


if __name__ == "__main__":
    for name, test in list(globals().items()):
        if name.startswith("test_"):
            test()
            print(f"ok  {name}")
