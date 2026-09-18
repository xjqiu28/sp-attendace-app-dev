# sp-attendance-app

## Apps Script backend (`gas/`)

The backend lives in `gas/` as multiple `.gs` files instead of one big
file. Apps Script doesn't support folders — every file in a project is
flat and shares one global scope — so no imports are needed between
them.

### Option A: push with clasp (recommended, one command)

[`clasp`](https://github.com/google/clasp) is Google's official CLI
for pushing local files into an Apps Script project. One-time setup:

1. `npm install` (installs `clasp` as a dev dependency).
2. `npm run gas:login` — opens a browser to authorize clasp with your
   Google account.
3. Get your project's Script ID: open the Apps Script editor for this
   project (from the Sheet: Extensions > Apps Script) > gear icon
   (Project Settings) > copy the **Script ID**.
4. `cp .clasp.json.example .clasp.json`, then paste your Script ID in,
   replacing `PASTE_YOUR_SCRIPT_ID_HERE`. `.clasp.json` is gitignored
   (only the `.example` template is tracked), so your Script ID never
   ends up in git history.
5. `npm run gas:pull` — pulls down the project's real `appsscript.json`
   manifest into `gas/` (don't skip this; it preserves your existing
   deployment/OAuth settings instead of the push overwriting them).

After that, any time you edit files in `gas/`:

```
npm run gas:push
```

pushes them straight into the Apps Script project — no copy-paste.
`npm run gas:open` opens the project in the browser if you want to
check it or redeploy from there.

**Redeploy after pushing** so the live web app URL picks up the
change: Deploy > Manage deployments > pencil/edit icon on your
existing deployment > Version: **New version** > Deploy. (A brand new
deployment instead of editing the existing one would change the URL.)

### Option B: copy-paste manually

If you'd rather not set up clasp, open your Apps Script project and
create a file with each of these names, then paste in the matching
contents:

- `Config.gs` — shared constants, including `SHEET_NAME` (must match
  your sheet's tab name; a Google Form linked to a Sheet names it
  `Form Responses 1` by default).
- `Utils.gs` — sheet/column/date/time helpers used by every other file.
- `Code.gs` — entry points: `myFunction` (legacy Google Form trigger),
  `doPost`, `doGet`.
- `AttendanceLogic.gs` — sign-in/sign-out recording logic.
- `DirectorView.gs` — director dashboard data (daily + weekly views).
- `WeeklyReport.gs` — the Friday auto-report to a per-week tab.
- `PersonalCodes.gs` — personal code generation.

After pasting all seven files in, redeploy (Deploy > Manage deployments
> Edit > New version) so the live web app picks up the changes.

### Sheet setup

Required headers on the response sheet: `Name`, `Personal Code`.
Optional: `Admin` (`Yes`/`True`/`Y`/`1` for director-dashboard access),
`Birthday` (needed for the "Generate New Codes" button), `Timestamp`.

### Generating personal codes from birthdays

The director dashboard has a "Generate New Codes" button. It fills in
a Personal Code for every person who has a `Birthday` but no code yet
— existing codes are never overwritten. The code is the birthday in
`MMDDYYYY` format (e.g. September 1, 2008 → `09012008`). Add the
`Birthday` column and values yourself; the script only reads it.
