# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A workspace for the **DMP Advance Solution Network (BKK) — Monthly Report**. The original
deliverable is a Power BI report (`Excel Data/OSP L2 รายทีม.pbix`) exported to PDF
(`Monthly report March 2026.pdf`). The active project, **`dmp-monthly-report/`**, reimplements
that PDF as an interactive React web app whose 21 report pages map 1:1 to PDF pages 2–22, with
live filtering by date range / zone / team / priority.

Most documentation and UI strings are in Thai. The detailed project README is
`dmp-monthly-report/README.md` (Thai) — read it for the per-page chart breakdown.

Almost all real work happens inside `dmp-monthly-report/`. `cd dmp-monthly-report` before
running any command below.

## Commands

```bash
cd dmp-monthly-report
npm install            # first time only

npm run dev            # Vite dev server at http://localhost:5173
npm run etl            # legacy ETL: read Excel from ../Excel Data/ → public/data.json (needs Python 3.10+ + openpyxl)
npm run build          # production bundle → dist/
npm run preview        # serve the built dist/

# Backend (FastAPI) — lets users upload Excel via the web UI instead of running ETL by hand
python3 -m venv server/.venv
source server/.venv/bin/activate          # Windows: server\.venv\Scripts\activate
pip install -r server/requirements.txt
python -m uvicorn server.app:app --host 0.0.0.0 --port 8000

npm run dev:all        # run Vite + uvicorn together (needs venv set up first; Ctrl+C stops both; works on Windows too)
npm run dev:server     # uvicorn only, with --reload
```

**Windows:** double-click `start.bat` (use the app on :8000) or `dev.bat` (hot reload on :5173) in the repo root.
Both call `dmp-monthly-report/scripts/setup-windows.bat`, which installs what is missing and, on first run,
seeds `server/storage/` from `../Excel Data/`. Keep `.bat` files CRLF (enforced by `.gitattributes`) and
ASCII-only; always `call npm ...` inside a batch file.

There is no test runner, linter, or formatter configured. The `etl/*.mjs` files are **not** a
test suite — they are throwaway Puppeteer scripts (named `check_*`, `crop_*`, `donut_*`,
`cap_*`, etc.) used during development to screenshot/diff rendered pages against the PDF. Ignore
them unless you are specifically reproducing a visual check.

## Architecture

Three layers, connected by a single generated `data.json`:

1. **ETL** turns the source Excel workbooks into one flat JSON dataset.
   - `server/etl.py` is the canonical implementation (used by the backend on upload).
   - `etl/build_data.py` is the older standalone version invoked by `npm run etl`.
   - Source files live in `../Excel Data/` named `Data Job done <YEAR>.xlsx|.xlsm`.
   - Output is `data.json` (~30 MB): `{ etl_version, generated_at, date_min, date_max, total, records[] }`.
   - **Bump `ETL_VERSION` in `server/etl.py` whenever the emitted records change** — the backend
     rebuilds `data.json` on startup when the stored version differs, so deploys need no manual rebuild.
   - **Records use single/two-letter keys** to keep the file small (see `transform()` in `server/etl.py`):
     `d` date (YYYY-MM-DD), `z` zone, `t` team label, `p` priority, `c` company, `a` assign_to,
     `zid` zone-by-site, `bw`/`aw` before/after waive, `ro` overdue reason, `sc` subcause,
     `ad`/`do`/`od`/`tt` durations in **seconds** (accept→depart, depart→onsite, onsite→done, total),
     `sol`/`prb`/`jb` solution/problem/job-id, and ISO timestamps `ct gt at it nt rt`
     (create, assign, accept, initiate/depart, onsite, report/finish) used by the Gantt view.

2. **FastAPI backend** (`server/app.py`) wraps the ETL so non-technical users can refresh data
   without SSH. Endpoints:
   - `GET /api/status` — uploaded files + data.json metadata
   - `POST /api/upload` — multipart; filename must be `Data Job done <YEAR>.xlsx|.xlsm`; triggers a rebuild
   - `DELETE /api/files/{name}` — remove a year's file and rebuild
   - `GET /data.json` — the dataset the frontend fetches (served no-cache)
   - Uploaded files and the built `data.json` are stored under `server/storage/` (override with env `DMP_STORAGE`).

3. **React + Vite frontend** (`src/`) renders the report.
   - `src/data.js` — `useData()` fetches `/data.json` once and caches it in a module-level variable.
   - `src/filters.jsx` — `FilterProvider` / `useFilters()` hold the global filter state (start, end,
     zones, teams, priorities; the filter bars never let a zone/team/priority selection go empty, and the
     default range is the latest month that has data). `applyFilters(jobs, f)` is the single chokepoint
     that every page runs the raw job list through before charting.
   - `src/App.jsx` — top-level layout, page routing/ordering, and the global FilterBar + Upload panel.
   - `src/pages/` — one component per report page. Charts use **Recharts**. Several `PageNN_*.jsx`
     files are thin wrappers (a few lines) that delegate to shared multi-instance page components
     (`JobPerDayPage`, `SlaPerTeamPage`, `AvgDurationPage`, `TotalJobOverviewPage`, the `Dash*` pages).
   - `src/components/` — `FilterBar`, `PageHeader`, `ChartCard`, `EditableNote`, `UploadPanel`.
   - `src/export.js` — PDF/PPTX export of the rendered report via `jspdf` + `html2canvas` + `pptxgenjs`.

In dev, `vite.config.js` proxies `/api/*` and `/data.json` to the backend (`DMP_BACKEND`, default
`http://localhost:8000`), so the frontend talks to FastAPI transparently. In production the built
`dist/` is served by the same uvicorn process — open `http://<host>:8000`.

### Conventions worth knowing

- Targets (260 jobs/zone, 86/team) are **per month**: always scale them with `targetForRange()` and build
  per-day charts with `dailyRows()` (both in `src/utils.js`). Never use `toISOString()` for dates — it
  shifts a day back in Bangkok time; use `addDaysISO` / `toISODate`.
- Shared report rules live in exactly one place: `SLA_PRIORITIES` (Critical + Major) in `src/theme.js`,
  `lastSixMonths()` and `prevMonthRange()` in `src/utils.js`. Import them; do not re-declare a local copy.
  What each page *is* allowed to differ on is which filters it skips in `applyFilters(records, f, skip)`.
- `src/theme.js` is the **single source of domain constants** — `ZONES`, `TEAMS`/`ALL_ZONE_TEAMS`,
  `PRIORITY_ORDER`, the priority color palette, and `MONTHS_EN`/`MONTHS_TH`. Read filters and pages
  off these rather than hardcoding zone/team/priority strings.
- `applyFilters(records, f, skip)` takes a `skip` array (`"date"`, `"zone"`, `"team"`, `"priority"`)
  so a page can deliberately ignore one filter dimension (e.g. a zone-comparison chart skips `"zone"`).
  Note: a record with no team (`r.t == null`) or no priority is **not** filtered out by those dimensions.
- Filter state and the active page persist to `localStorage` (`dmp.filters.v1`, `dmp.activeId.v1`),
  so a stale UI may reflect old filters — use the FilterBar reset, not a hard reload.
- PDF/PPTX export (`src/export.js`) works by switching `activeId` through each page, waiting for
  Recharts to paint, and screenshotting with `html2canvas`. **Only the 21 `NAV` report pages are
  exported — the `DASH` back-office dashboards are not.** Charts must actually render in the DOM for
  capture to work (no headless/SSR path).

## Domain rules that affect correctness

These encode reporting conventions that aren't obvious from the code and must be preserved to keep
numbers matching the original Power BI report:

- **Month grouping uses `REPORT_DATE`** (when the job was completed), not the creation date — this is
  what makes totals match the published Power BI report. Don't switch to another date field.
- **Team-in-zone detection** relies on the pattern `Dmplocal(latkrabang|pathumthani) [A-C]`. Zones are
  Latkrabang and Pathumthani; each has teams A/B/C.
- **SLA% may differ ~1–2% from the original PDF** because of how blank rows are counted. The relevant
  logic is `teamSla()` in `src/pages/Page22_KPISla.jsx`.

## Deploying

Production runs as **Docker Compose on baanmefai `176.80.40.4`** (moved off pm2 on the Mac mini on
2026-09-16). Code lives at `/srv/apps/osp-l2`, data at `/srv/data/dmp-report` (outside git).

```bash
ssh baanmefai
cd /srv/apps/osp-l2 && git pull && docker compose up -d --build dmp-report
```

- Full runbook incl. first-time setup, data rsync, rollback and the Cloudflare Tunnel cutover:
  **`deploy/runbooks/deploy.md`**
- Traps that have already bitten (data outside git, route ordering in `app.py`, tunnel ownership):
  **`.claude/knowledge/gotchas.md`**
- `Dockerfile` is in `dmp-monthly-report/` (it is also the build context, so the 106 MB `Excel Data/`
  never enters the image); `compose.yml` is at the repo root. No `.env` is needed — `compose.yml`
  defaults `APP_PORT` to 8000 and `DATA_DIR` to `/srv/data/dmp-report`.

The old Windows-VPS route (`server/run.bat` + NSSM) is retired — steps kept in
`dmp-monthly-report/README.md` for reference only.
