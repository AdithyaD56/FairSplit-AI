# FairSplit AI

FairSplit AI is a split-first web app for friends. It turns messy shared-expense stories into fair shares and simplified settlements, with trip planning kept as a secondary helper for pre-trip budgeting and saved drafts.

## Tech Stack

- Frontend: React + Vite + Tailwind CSS
- Backend: FastAPI + SQLAlchemy + SQLite
- Authentication: JWT with bcrypt password hashing
- AI parsing and assistant generation: OpenAI-compatible models or Gemini with deterministic fallbacks when no API key is configured

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
  src/
    components/
    context/
    pages/
    services/
    utils/
  package.json
  .env.example
```

## Backend Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Edit `backend/.env` if you want richer AI parsing and assistant replies. If you leave the AI keys blank, the backend uses local fallback logic so the app still runs for demos.

OpenAI-compatible setup:

- `OPENAI_API_KEY`
- Optional `OPENAI_BASE_URL` if you want to use a compatible provider like Groq
- `OPENAI_MODEL`

Example Groq setup:

```env
OPENAI_API_KEY=your_groq_key
OPENAI_BASE_URL=https://api.groq.com/openai/v1
OPENAI_MODEL=openai/gpt-oss-20b
```

Optional online integrations:

- `GEMINI_API_KEY` + `GEMINI_MODEL` for backup AI parsing and assistant generation if OpenAI-compatible inference is not configured
- `SENTRY_DSN` for backend error logging

Run the API:

```bash
uvicorn app.main:app --reload --port 8000
```

The first startup creates the SQLite database and seeds an admin account from `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_NAME`.

Default admin credentials from `.env.example`:

- Email: `admin@fairsplit.ai`
- Password: `Admin@12345`

Default demo student credentials:

- Email: `student@fairsplit.ai`
- Password: `Student@123`

## Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

Optional frontend telemetry:

- Set `VITE_SENTRY_DSN` in `frontend/.env` to enable browser-side Sentry logging

## Key API Endpoints

- `POST /signup`
- `POST /login`
- `GET /me`
- `POST /analyze-expense`
- `POST /plan-trip-budget`
- `GET /history`
- `POST /plan-trip-from-prompt`
- `POST /trips/generate`
- `GET /trips`
- `GET /trips/{trip_id}`
- `POST /integrations/assistant-chat`
- `POST /integrations/travel-assistant`
- `GET /admin/users`
- `GET /admin/expenses`
- `DELETE /admin/users/{user_id}`
- `DELETE /admin/expenses/{expense_id}`

## Example Scenario

```text
We went to a restaurant. Total 1200. Me and Arun ate full, Ravi ate half, Karthik didn't eat. I paid.
```

FairSplit AI extracts participants, participation weights, payer, and total amount, then returns individual shares and who should reimburse whom.

## Main Product Features

- Natural-language expense splitting with voice input, OCR receipt import, and saved split history
- Floating FairSplit assistant for settlement questions and budget-aware trip follow-ups
- Prompt-to-plan trip budgeting as a secondary workflow
- Saved trip drafts with itinerary and stay suggestions
- My Trips page plus dedicated trip detail pages
- Real-time weather, currency conversion, and Google Maps shortcuts for optional trip research

## Planning And Assistant APIs

- `POST /plan-trip-budget`
- `POST /plan-trip-from-prompt`
- `POST /integrations/live-insights`
- `POST /integrations/assistant-chat`
- `POST /integrations/travel-assistant`
