"""Tests for logic.py without Home Assistant: python3 tests/test_logic.py (or pytest)."""

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent.parent / "custom_components" / "essential_budget"))

from logic import BudgetError, default_data, monthly, totals, validate  # noqa: E402

SAMPLE = {
    "persons": {"a": "  Alex ", "b": "Sam"},
    "income": [
        {"name": "Salary", "person": "a", "gross": 4800, "amount": 3150, "annual_gross": 58000},  # annual_gross: dropped
        {"name": "Side job", "person": "a", "amount": 450.004},
        {"name": "Salary", "person": "b", "amount": 2480},
        {"name": "", "person": "b", "amount": 0},  # empty row: dropped
    ],
    "shared_income": [{"name": "Child benefit", "to": "a", "amount": 518}],
    "special_payments": [
        {"name": "Christmas bonus", "person": "a", "gross": 3400, "amount": 1900},  # amount (net): dropped
        {"name": "Bonus", "person": "b", "gross": 800},
    ],
    "fixed_costs": [
        {"name": "Rent", "category": "Home", "person": "a", "amount": 1480, "interval_months": 1},
        {"name": "Liability", "category": "Insurance", "person": "b", "amount": 89, "interval_months": 12},
        {"name": "Broadcasting fee", "category": "  Home ", "person": "b", "amount": 55.08, "payments_per_year": 4},  # 0.2.0 betas
        {"name": "Car tax", "category": "Car", "person": "a", "amount": 240, "interval_months": 24},
    ],
    "annual_gross": [{"name": "Gross Alex", "amount": 58000}],  # list of earlier versions: dropped
    "bonuses": [{"name": "Bonus", "amount": 3200}],  # list of earlier versions: dropped
    "colors": {"a": "#2F6FDE", "b": ""},
    "unknown": "dropped",
}


def test_validate_cleans() -> None:
    data = validate(SAMPLE)
    assert data["version"] == 1
    assert data["persons"] == {"a": "Alex", "b": "Sam"}
    assert len(data["income"]) == 3
    assert data["income"][1]["amount"] == 450.0
    assert data["income"][0] == {"name": "Salary", "person": "a", "gross": 4800.0, "amount": 3150.0}
    assert "gross" not in data["income"][1]  # optional, not written when empty
    assert "gross" not in validate({"income": [{"name": "X", "person": "a", "amount": 1, "gross": ""}]})["income"][0]
    assert data["special_payments"] == [
        {"name": "Christmas bonus", "person": "a", "gross": 3400.0},
        {"name": "Bonus", "person": "b", "gross": 800.0},
    ]
    assert data["colors"] == {"a": "#2f6fde"}
    assert data["fixed_costs"][2]["interval_months"] == 3  # converted from payments_per_year
    assert data["fixed_costs"][2]["category"] == "Home"
    assert "unknown" not in data and "annual_gross" not in data and "bonuses" not in data
    assert list(data["fixed_costs"][0]) == ["name", "category", "person", "amount", "interval_months"]
    assert validate(data) == data  # stable


def test_defaults() -> None:
    data = default_data("", " Sam ")
    assert data["persons"] == {"a": "Person A", "b": "Sam"}
    assert validate(data) == data
    assert validate({})["persons"]["a"] == "Person A"
    assert "colors" not in data
    # interval_months defaults to monthly, category may be empty
    cost = validate({"fixed_costs": [{"name": "X", "person": "a", "amount": 10}]})["fixed_costs"][0]
    assert cost == {"name": "X", "category": "", "person": "a", "amount": 10.0, "interval_months": 1}


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
        ({"fixed_costs": [{"name": "X", "person": "a", "amount": 1, "interval_months": 121}]}, "interval_months"),
        ({"fixed_costs": [{"name": "X", "person": "a", "amount": 1, "interval_months": 2.5}]}, "interval_months"),
        ({"fixed_costs": [{"name": "X", "person": "a", "amount": 1, "payments_per_year": 13}]}, "payments_per_year"),
        ({"colors": {"a": "blue"}}, "colors: a"),
        ({"income": [{"name": "X", "person": "a", "amount": -1}]}, "income 1: amount"),
        ({"income": [{"name": "X", "person": "a", "amount": "12"}]}, "income 1: amount"),
        ({"income": [{"name": "X", "person": "a", "amount": True}]}, "income 1: amount"),
        ({"shared_income": [{"name": "X", "amount": 1}]}, "shared_income 1: to"),
        ({"income": {}}, "income: list"),
        ({"special_payments": [{"name": "X", "person": "a", "gross": -1}]}, "special_payments 1: gross"),
        ({"income": [{"name": "X", "person": "a", "amount": 1, "gross": -5}]}, "income 1: gross"),
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
    assert t["income"] == 3150 + 450 + 2480 + 518  # special payments are not monthly income
    assert t["annual_gross_per_person"] == {"a": 12 * 4800 + 3400, "b": 800}
    costs = 1480 + 89 / 12 + 55.08 / 3 + 240 / 24
    assert abs(t["fixed_costs"] - costs) < 1e-9
    assert abs(t["budget"] - (t["income"] - costs)) < 1e-9
    assert t["budget_per_person"]["a"] == 3150 + 450 + 518 - 1480 - 10
    assert abs(t["budget_per_person"]["b"] - (2480 - 89 / 12 - 55.08 / 3)) < 1e-9


if __name__ == "__main__":
    for name, test in list(globals().items()):
        if name.startswith("test_"):
            test()
            print(f"ok  {name}")
