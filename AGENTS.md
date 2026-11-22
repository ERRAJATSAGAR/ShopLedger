# ShopLedger Agent Guide

## Stack
- Node.js application using Express 4 (`express` ^4.17.1) and `body-parser` ^1.19.0.
- Browser assets are static files under `public/`; application data is stored in `data/db.json`.

## Module map
- `routes/customers.js` — lists customers and recent settlements; records Khata settlements.
- `routes/orders.js` — lists, fetches, creates, and cancels orders.
- `routes/products.js` — lists products and active coupons.
- `routes/reports.js` — dashboard and GST reports, pricing preview, and keyed data export.
- `lib/coupons.js` — normalizes, validates, calculates, and lists coupons from config.
- `lib/dates.js` — formats today, normalizes date keys, and derives fiscal years.
- `lib/inventory.js` — finds products, checks stock, reserves/releases units, and summarizes inventory.
- `lib/invoice.js` — computes invoice figures and renders printable invoice HTML.
- `lib/ledger.js` — finds/lists customers, charges or reverses Khata orders, and records settlements.
- `lib/orders.js` — adds, gets, cancels, and filters orders.
- `lib/pricing.js` — computes subtotals, discounts, line tax, and order totals.
- `lib/reports.js` — builds dashboard summaries and compares stored orders with invoice figures.
- `lib/store.js` — reads/writes `data/db.json` and appends audit entries.
- `lib/tax.js` — resolves GST rates from item data/HSN config and splits CGST/SGST.

## Commands
- Start the app: `node server.js` (or `npm start`).
- Run tests: `node --test` (the current `package.json` test script is a placeholder).

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).
