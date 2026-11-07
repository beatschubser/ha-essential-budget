# Essential Budget

A static household budget for Home Assistant, for one or two persons: monthly net income, shared income, fixed costs by category and what is left per month, plus yearly values like the annual gross. No bank connection and no expense tracking: you enter your fixed values once and keep them up to date.

> **Beta.** This integration is new; please report problems in the [issues](https://github.com/beatschubser/ha-essential-budget/issues).

## Features

- **Key figures:** income, fixed costs (with their share of the income) and the budget after fixed costs, per month
- **One or two persons:** leave the name of the second person empty for a budget of one person
- **Income (net):** any number of income items per person, each optionally with its annual gross, plus shared income such as child benefit (each assigned to the account of one person)
- **Fixed costs:** free categories, paid by one of the persons, paid 1 to 12 times a year. All costs are converted to a monthly value (a yearly payment counts with one twelfth)
- **Categories** sorted by size with share and bar; expand a category to see its items, or open it for all details (amount per payment, per month, per year)
- **Budget per person** (with two persons): own income + shared income received by the person − fixed costs paid by the person; negative values are shown in red
- **Annual gross:** the annual gross entered with the income items plus free yearly values, with total; **bonuses (net)** as free yearly values
- **Editing in the card editor:** open the card in the dashboard editor and the preview shows the budget in edit mode (saved with its own button; administrators only)
- Desktop layout on wide cards, one column on phones; follows the colors of your theme
- English and German; amounts stored with cents and shown in whole units, currency selectable per card (default EUR)

## Installation

1. HACS > three dots > **Custom repositories** > add `https://github.com/beatschubser/ha-essential-budget` as type **Integration**
2. Install **Essential Budget** and restart Home Assistant
3. **Settings > Devices & services > Add integration > Essential Budget** and enter the name of the person and, optionally, of a second one

The card is registered automatically. Add it to a dashboard with **Add card > Essential Budget** or in YAML:

```yaml
type: custom:essential-budget-card
title: Budget   # optional
currency: CHF   # optional, ISO code, default EUR
```

To enter or change the budget, edit the dashboard and open the card: the preview on the right is in edit mode. Save the budget with **Save budget** below the entries; the save button of the dialog only saves the card options (title, currency, size).

## Your data

Everything is stored in **`.storage/essential_budget.json`** in your Home Assistant config folder, as readable JSON:

```json
{
  "version": 1,
  "persons": { "a": "Alex", "b": "Sam" },
  "income": [{ "name": "Salary", "person": "a", "amount": 3150.0, "annual_gross": 58000.0 }],
  "shared_income": [{ "name": "Child benefit", "to": "a", "amount": 255.0 }],
  "fixed_costs": [
    { "name": "Rent", "category": "Home", "person": "a", "amount": 1480.0, "payments_per_year": 12 },
    { "name": "Liability insurance", "category": "Insurance", "person": "b", "amount": 89.0, "payments_per_year": 1 }
  ],
  "annual_gross": [{ "name": "Capital gains", "amount": 600.0 }],
  "bonuses": [{ "name": "Annual bonus", "amount": 3200.0 }]
}
```

- `amount` of a fixed cost is the amount **per payment**; `payments_per_year` is 1 (yearly) to 12 (monthly)
- `annual_gross` of an income item is optional and appears with the annual gross values
- `"b": ""` means a budget of one person; then every entry belongs to person `a`
- You can edit the file by hand (best while Home Assistant is stopped); the changes are read when Home Assistant starts. If the file cannot be read, the card shows an error, a repair notice appears and saving is blocked until the file is fixed, so it is never overwritten by accident
- The file is part of every Home Assistant backup. Removing the integration keeps the file
- Everyone who can open the dashboard can see the budget; only administrators can edit it

## Notes

This is an unofficial project, written with the help of AI (Claude by Anthropic).
