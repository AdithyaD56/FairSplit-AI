# FairSplit AI

Split-first group finance, with travel planning kept smart, lightweight, and optional.

## V1.0 Initial Release

- **Version:** `V1.0`

FairSplit AI helps friends and groups turn messy shared-expense stories into clean reimbursements, fair shares, and simple decisions. The product is designed around one core promise: make bill splitting feel clear and effortless. Travel planning is included as a secondary helper for budget-minded trip drafting and destination support.

## Main Purpose

The main purpose of FairSplit AI is to make shared-expense management easier, faster, and fairer for groups. Instead of forcing users to manually break down every payment and participant, the app allows them to describe the situation naturally and receive a clear settlement outcome. The application is built to reduce confusion, save time, and help friends, roommates, and travel groups handle money conversations more smoothly.

## Why FairSplit AI

Most shared-expense apps expect users to manually enter every participant, amount, and split rule. FairSplit AI reduces that friction by letting users describe the situation naturally and then turning it into:

- participant-aware share calculations
- simplified settlements
- saved split history
- optional trip-budget support

## Core Highlights

- Natural-language expense splitting
- Fair-share and reimbursement calculation
- Saved split history
- Admin dashboard and developer profile management
- Social login support
- Real-time activity updates
- Review and feedback system
- Trip draft generation and lightweight travel assistance

## Release Scope

This repository reflects the **`V1.0` initial release**.

Included in `V1.0`:

- account signup and login
- expense analysis and settlement output
- split history
- trip draft generation and saved trip views
- reviews and live activity experiences
- public developer page and admin editing tools

Planned for later updates:

- forgot-password recovery flow

## Tech Stack

| Layer | Stack |
| --- | --- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL or SQLite |
| Authentication | JWT, bcrypt password hashing |
| AI Support | OpenAI-compatible models or Gemini fallback |
| Deployment | Cloudflare Pages, Render, Neon |

## Live Product Notes

- **Frontend:** hosted on Cloudflare Pages
- **Backend:** hosted on Render
- **Database:** connected through Neon Postgres

## Project Structure

```text
backend/
  app/
    core/
    models/
    routers/
    schemas/
    services/
    main.py
  requirements.txt
  .env.example

frontend/
  public/
  src/
    components/
    context/
    pages/
    services/
    utils/
  package.json
  .env.example
```

## Local Setup

### Backend

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

## Configuration Notes

Optional AI setup:

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL`
- `GEMINI_API_KEY`
- `GEMINI_MODEL`

Optional monitoring:

- `SENTRY_DSN` for backend
- `VITE_SENTRY_DSN` for frontend

The app still runs with fallback logic when AI keys are not configured.

## Admin Access

The first startup seeds an admin account using:

- `ADMIN_EMAIL`
- `ADMIN_PASSWORD`
- `ADMIN_NAME`

Default admin values from `.env.example`:

- **Email:** `admin@fairsplit.ai`
- **Password:** `Admin@12345`

## Key API Endpoints

### Authentication

- `POST /signup`
- `POST /login`
- `GET /me`

### Splitting

- `POST /analyze-expense`
- `GET /history`

### Trip Planning

- `POST /plan-trip-budget`
- `POST /plan-trip-from-prompt`
- `POST /trips/generate`
- `GET /trips`
- `GET /trips/{trip_id}`

### Assistant And Integrations

- `POST /integrations/assistant-chat`
- `POST /integrations/travel-assistant`
- `POST /integrations/live-insights`

### Admin

- `GET /admin/users`
- `GET /admin/expenses`
- `GET /admin/reviews`
- `GET /admin/developer-profile`
- `PUT /admin/developer-profile`

## Example Expense Scenario

```text
We went to a restaurant. Total 1200. Me and Arun ate full, Ravi ate half, Karthik didn't eat. I paid.
```

FairSplit AI extracts the payer, participants, participation weight, and total amount, then returns a settlement-friendly breakdown.

## Product Positioning

FairSplit AI is intentionally **split-first**.

That means:

- expense clarity comes before everything else
- travel planning exists to support group budgeting, not distract from it
- the assistant is designed to stay practical and direct

## User Manual

The public user manual is available here:

- [USER_MANUAL.md](./USER_MANUAL.md)

And on the live homepage through the **User Manual** button.

## Closing Note

FairSplit AI `V1.0` is the foundation release: a cleaner, more conversational way to split shared expenses while keeping travel planning useful but secondary.

## Project Info

- **Live Site:** [https://fairsplit-ai.pages.dev](https://fairsplit-ai.pages.dev)
- **Author:** `Dhavala V D M Adithya Naidu`
