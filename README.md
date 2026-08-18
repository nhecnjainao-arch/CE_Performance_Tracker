# CE Performance Tracker

A GitHub Pages-ready Customer Engineer performance dashboard.

## What it does

- Upload `.xlsx`, `.xls`, or `.csv` performance exports.
- Automatically detects common column names.
- Keeps previous uploads in browser localStorage.
- Calculates weighted performance scores.
- Ranks all employees.
- Filters by All Employees or East Team.
- Searches by CE name/code.
- Shows weekly and monthly records when a date/period column exists.
- Provides employee history.
- Allows scoring weights to be changed.
- Exports a JSON backup.

## East Team

The following names are automatically classified as EAST:

- NHEC NJ INAO
- Elmer Salcedo
- Marwan Elgorsh
- Musa Elsiddig
- HASSAN ALKABBAZ
- NAYYAR ABBAS

Matching is case-insensitive.

## Default weights

- 7 Day SLM Revisit: 20% — lower is better
- CCPDW: 15% — lower is better
- Retrip: 20% — lower is better
- Response SLA: 15% — higher is better
- Utilization: 15% — higher is better
- Call Fundamentals: 15% — higher is better

## Important limitation

GitHub Pages is a static website. Uploaded data is stored in the browser's localStorage, so it is private to that browser/device and is not automatically shared with other devices.

For a multi-user/company system, replace localStorage with a backend/database such as Supabase or Firebase.

## Deploy to GitHub Pages

1. Create/open your GitHub repository.
2. Upload `index.html`, `style.css`, and `app.js`.
3. Commit changes.
4. Go to Settings → Pages.
5. Select Deploy from branch.
6. Select `main` and `/root`.
7. Save.
