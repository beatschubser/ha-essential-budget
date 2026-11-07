# Essential Budget

A static household budget for Home Assistant: the monthly net income of two persons, shared income, fixed costs by category and what is left per month, plus yearly values like the annual gross. No bank connection and no expense tracking: you enter your fixed values once and keep them up to date.

> **Beta.** This integration is new; please report problems in the [issues](https://github.com/beatschubser/ha-essential-budget/issues).

## Features

- **Key figures:** income, fixed costs (with their share of the income) and the budget after fixed costs, per month
- **Income (net):** any number of income items per person, plus shared income such as child benefit (each assigned to the account of one person)
- **Fixed costs:** free categories, paid by one of the two persons, paid 1 to 12 times a year. All costs are converted to a monthly value (a yearly payment counts with one twelfth)
- **Categories** sorted by size with share and bar; expand a category to see its items, or open it for all details (amount per payment, per month, per year)
- **Budget per person:** own income + shared income received by the person − fixed costs paid by the person; negative values are shown in red
- **Annual gross** and **bonuses (net)** as free yearly values with totals
- **Edit mode** directly in the card (pencil button, administrators only)
- Desktop layout on wide cards, one column on phones; follows the colors of your theme
- English and German; amounts in the currency of Home Assistant, stored with cents and shown in whole units

## Installation

1. HACS > three dots > **Custom repositories** > add `https://github.com/beatschubser/ha-essential-budget` as type **Integration**
2. Install **Essential Budget** and restart Home Assistant
3. **Settings > Devices & services > Add integration > Essential Budget** and enter the names of the two persons

The card is registered automatically. Add it to a dashboard with **Add card > Essential Budget** or in YAML:

```yaml
type: custom:essential-budget-card
title: Budget  # optional
```

The visual editor of the card only has the optional title; size and position are set in the dashboard as usual.

## Your data

Everything is stored in **`essential_budget.json`** in your Home Assistant config folder, as readable JSON:

```json
{
  "version": 1,
  "persons": { "a": "Alex", "b": "Sam" },
  "income": [{ "name": "Salary", "person": "a", "amount": 3150.0 }],
  "shared_income": [{ "name": "Child benefit", "to": "a", "amount": 255.0 }],
  "fixed_costs": [
    { "name": "Rent", "category": "Home", "person": "a", "amount": 1480.0, "payments_per_year": 12 },
    { "name": "Liability insurance", "category": "Insurance", "person": "b", "amount": 89.0, "payments_per_year": 1 }
  ],
  "annual_gross": [{ "name": "Gross salary Alex", "amount": 58000.0 }],
  "bonuses": [{ "name": "Annual bonus", "amount": 3200.0 }]
}
```

- `amount` of a fixed cost is the amount **per payment**; `payments_per_year` is 1 (yearly) to 12 (monthly)
- You can edit the file by hand; the changes are read when Home Assistant starts. If the file cannot be read, the card shows an error, a repair notice appears and saving is blocked until the file is fixed, so it is never overwritten by accident
- The file is part of every Home Assistant backup. Removing the integration keeps the file
- Everyone who can open the dashboard can see the budget; only administrators can edit it

## Notes

This is an unofficial project, written with the help of AI (Claude by Anthropic).
