# Essential Budget

A static household budget for Home Assistant, for one or two persons: monthly net income, shared income, fixed costs by category and what is left per month, plus yearly values like the annual gross. No bank connection and no expense tracking: you enter your fixed values once and keep them up to date.

> **Beta.** This integration is new; please report problems in the [issues](https://github.com/beatschubser/ha-essential-budget/issues).

## Features

- **Key figures:** income, fixed costs (with their share of the income) and the budget after fixed costs, per month
- **One or two persons:** leave the name of the second person empty for a budget of one person
- **Income:** any number of monthly income items per person with gross (optional) and net, plus shared income such as child benefit (each assigned to the account of one person)
- **Special payments:** once a year (bonus, Christmas bonus) with gross and net; they count for the annual gross, not for the monthly income
- **Fixed costs:** free categories, paid by one of the persons, paid 1 to 12 times a year. All costs are converted to a monthly value (a yearly payment counts with one twelfth)
- **Categories** sorted by size with share and bar; expand a category to see its items, or open it for all details (amount per payment, per month, per year)
- **Budget per person** (with two persons): own income + shared income received by the person − fixed costs paid by the person; negative values are shown in red
- **Annual gross** in its own box, per person: 12 × the monthly gross of the income + the gross of the special payments
- **Editing in the card editor:** open the card in the dashboard editor and the preview shows the budget in edit mode (saved with its own button; administrators only)
- **Privacy mode** (optional): all numbers are blurred until you tap one of the key figures; they are hidden again after a set time (default 30 seconds), when the app or browser tab goes to the background and when you tap again
- Desktop layout on wide cards, one column on phones; follows the colors of your theme
- English and German; amounts stored with cents and shown in whole units of the currency set in Home Assistant (Settings > System > General)

## Installation

1. HACS > three dots > **Custom repositories** > add `https://github.com/beatschubser/ha-essential-budget` as type **Integration**
2. Install **Essential Budget** and restart Home Assistant
3. **Settings > Devices & services > Add integration > Essential Budget** and enter the name of the person and, optionally, of a second one

The card is registered automatically. Add it to a dashboard with **Add card > Essential Budget** or in YAML:

```yaml
type: custom:essential-budget-card
title: Budget          # optional
privacy: true          # optional: numbers blurred until a key figure is tapped
privacy_seconds: 60    # optional: hide the numbers again after (default 30)
```

To enter or change the budget, edit the dashboard and open the card: the preview on the right is in edit mode. Save the budget with **Save budget** below the entries; the save button of the dialog only saves the card options (title, privacy mode, size).

## Your data

Everything is stored in **`.storage/essential_budget.json`** in your Home Assistant config folder, as readable JSON:

```json
{
  "version": 1,
  "persons": { "a": "Alex", "b": "Sam" },
  "income": [{ "name": "Salary", "person": "a", "gross": 4800.0, "amount": 3150.0 }],
  "special_payments": [{ "name": "Christmas bonus", "person": "a", "gross": 3400.0, "amount": 1900.0 }],
  "shared_income": [{ "name": "Child benefit", "to": "a", "amount": 255.0 }],
  "fixed_costs": [
    { "name": "Rent", "category": "Home", "person": "a", "amount": 1480.0, "payments_per_year": 12 },
    { "name": "Liability insurance", "category": "Insurance", "person": "b", "amount": 89.0, "payments_per_year": 1 }
  ]
}
```

- `amount` of a fixed cost is the amount **per payment**; `payments_per_year` is 1 (yearly) to 12 (monthly)
- `amount` of income and special payments is the net amount, `gross` is optional
- `"b": ""` means a budget of one person; then every entry belongs to person `a`
- You can edit the file by hand (best while Home Assistant is stopped); the changes are read when Home Assistant starts. If the file cannot be read, the card shows an error, a repair notice appears and saving is blocked until the file is fixed, so it is never overwritten by accident
- The file is part of every Home Assistant backup. Removing the integration keeps the file
- Everyone who can open the dashboard can see the budget; only administrators can edit it

## Notes

This is an unofficial project, written with the help of AI (Claude by Anthropic).
