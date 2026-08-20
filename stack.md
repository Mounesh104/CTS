# Tech Stack — PAPRS

## Frontend

| Layer | Technology | Version |
|---|---|---|
| UI framework | React | 19.2.8 |
| Build tool / dev server | Vite (rolldown-vite) | 8.2.x |
| Styling | Tailwind CSS | 4.3.x (via `@tailwindcss/vite`) |
| Charts | Recharts | 3.10.x |
| Icons | lucide-react | 1.31.x |
| Linting | oxlint | 1.75.x |
| Runtime | Node.js | 24.x |

No state-management library (Redux/Zustand/etc.) — a single `patients` array
and `appSettings` object live in `App.jsx` state, loaded from the backend on
mount and passed down as props. No router library — tab switching is a
`useState` string (`activeTab`) with conditional rendering.

## Backend

| Layer | Technology | Version |
|---|---|---|
| API framework | FastAPI | 0.115.6 |
| ASGI server | Uvicorn | 0.32.1 |
| Data validation | Pydantic | 2.10.3 |
| Settings management | pydantic-settings | 2.6.1 |
| Database | SQLite | stdlib `sqlite3`, no ORM |
| Email validation | email-validator | 2.3.0 |
| Env config | python-dotenv | 1.0.1 |
| HTTP client (tests) | httpx | 0.28.1 |
| Test runner | pytest | 8.3.4 |
| Runtime | Python | 3.13.5 |

All database access is raw parameterized SQL (`app/crud/`) — no SQLAlchemy
or other ORM. Schema lives in a single `app/db/schema.sql`, applied via
`executescript()` on startup (idempotent `CREATE TABLE IF NOT EXISTS`).

## Machine Learning

| Purpose | Technology | Version |
|---|---|---|
| Risk classifier | XGBoost | 2.1.3 |
| Train/test split, metrics | scikit-learn | 1.5.2 |
| Survival analysis | lifelines (Cox Proportional Hazards) | 0.30.3 |
| Data wrangling | pandas | 2.2.3 |
| Model persistence | joblib | 1.5.3 |
| Calibration plots | matplotlib | 3.11.1 |

Explainability uses XGBoost's native TreeSHAP (`pred_contribs=True`) rather
than the separate `shap` package. Model artifacts are saved to
`backend/app/ml/artifacts/` (XGBoost) and `backend/app/ml/model_output/`
(Cox PH), loaded lazily by `app/ml/predictor.py` for on-demand inference.

## Auth

Custom-built, no third-party auth provider (Auth0/Clerk/Firebase/etc.) and
no JWT/session-token library — session state is a plain user object in
`sessionStorage` on the frontend, validated against the `USERS` table on
each login. Passwords are salted + PBKDF2-HMAC-SHA256 hashed via Python's
stdlib `hashlib` + `secrets` (`app/core/security.py`) — no bcrypt/argon2
dependency was added.

## Database

Single SQLite file (`backend/paprs.db`), no separate database server.
11 tables: `PATIENT`, `PHARMACY_CLAIM`, `SUPPORT_EVENT`, `INSURANCE`,
`ML_FEATURES`, `THERAPY_OUTCOME`, `RISK_SCORE`, `ACTION_RULES`,
`OUTCOME_LOG`, `MODEL_METRICS`, `SETTINGS`, plus `USERS` for auth.

## Dev tooling used to build/verify this project

- **Playwright** (Chromium, headless) — used ad hoc to browser-test changes
  end-to-end during development; not a project dependency (not in
  `package.json`), just installed locally when needed for verification.
- **oxlint** — configured linter (`.oxlintrc.json`), run via `npm run lint`.

## Notably absent

- No ORM (SQLAlchemy, Prisma, etc.)
- No state management library on the frontend
- No CSS-in-JS — Tailwind utility classes only
- No containerization (Docker) — run directly via `venv` + `npm run dev`
- No CI/CD config in this repo
- No authentication-as-a-service — everything in `app/routers/auth.py` is
  hand-rolled
