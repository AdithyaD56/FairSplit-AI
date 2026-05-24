<div align="center">

# 💸 FairSplit AI

### Split Smarter • Settle Faster • Budget Better

<p align="center">
  <img src="https://img.shields.io/badge/Version-V1.0-blue?style=for-the-badge" />
  <img src="https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react" />
  <img src="https://img.shields.io/badge/Backend-FastAPI-009688?style=for-the-badge&logo=fastapi" />
  <img src="https://img.shields.io/badge/Database-PostgreSQL%20%2F%20SQLite-336791?style=for-the-badge&logo=postgresql" />
  <img src="https://img.shields.io/badge/Auth-JWT-success?style=for-the-badge" />
</p>

<p align="center">
  <b>FairSplit AI</b> is a split-first group finance platform that transforms messy shared-expense stories into clean settlements, fair reimbursements, and effortless budgeting.
</p>

<p align="center">
  Designed for friends, roommates, students, and travel groups — with lightweight travel planning kept smart, practical, and optional.
</p>

<p align="center">
  <a href="https://fairsplit-ai.pages.dev">
    🌐 Live Demo
  </a>
</p>

</div>

---

# ✨ V1.0 Initial Release

- **Version:** `V1.0`

FairSplit AI helps groups handle money conversations more smoothly by turning natural-language expense descriptions into clear reimbursement outcomes.

Instead of manually calculating who owes what, users can simply describe the situation conversationally and receive:
- participant-aware share calculations
- fair reimbursements
- settlement-friendly breakdowns
- saved split history
- optional trip-budget support

Travel planning exists only as a lightweight companion to support smarter group budgeting without distracting from the app’s core focus: **expense clarity**.

---

# 🎯 Main Purpose

The main purpose of FairSplit AI is to make shared-expense management:
- easier
- faster
- clearer
- more practical
- less stressful for groups

The application reduces friction by allowing users to describe expenses naturally instead of manually entering every participant, percentage, and reimbursement rule.

It is designed to:
- reduce confusion
- save time
- simplify reimbursements
- improve transparency
- make shared finance feel effortless

---

# 🚀 Why FairSplit AI

Most shared-expense platforms expect users to:
- manually add every participant
- configure split rules
- calculate reimbursements themselves

FairSplit AI removes that friction through conversational AI-powered expense understanding.

The platform intelligently converts messy expense stories into:
- accurate share calculations
- simplified settlements
- saved financial history
- optional trip-budget guidance

---

# 🌟 Core Highlights

## 🧠 AI-Powered Expense Splitting
- Natural-language expense understanding
- Fair-share calculations
- Smart settlement generation
- Participation weight handling
- Deterministic fallback logic

---

## 💸 Split Management
- Saved split history
- Reimbursement tracking
- Settlement-friendly outputs
- Live activity updates

---

## ✈️ Lightweight Travel Planning
- Trip draft generation
- Budget-aware travel support
- Destination suggestions
- Stay recommendations
- Travel assistant tools

---

## 🤖 Assistant & Experience
- Floating AI assistant
- Review and feedback system
- Social login support
- Developer profile system
- Admin editing tools

---

# 📦 Release Scope

This repository reflects the **`V1.0` initial release**.

## ✅ Included In V1.0

- Account signup and login
- Expense analysis and settlement output
- Split history
- Trip draft generation
- Saved trip views
- Reviews and live activity experiences
- Public developer page
- Admin editing tools

---

## 🔮 Planned For Later Updates

- Forgot-password recovery flow
- Advanced collaborative splitting
- Real-time sync improvements
- Expense analytics dashboard
- Multi-currency settlements

---

# 🛠️ Tech Stack

| Layer | Technologies |
| :--- | :--- |
| Frontend | React, Vite, Tailwind CSS |
| Backend | FastAPI, SQLAlchemy |
| Database | PostgreSQL / SQLite |
| Authentication | JWT + bcrypt password hashing |
| AI Support | OpenAI-compatible models or Gemini fallback |
| Deployment | Cloudflare Pages, Render, Neon |

---

# 🌐 Live Product Notes

| Service | Platform |
| :--- | :--- |
| Frontend Hosting | Cloudflare Pages |
| Backend Hosting | Render |
| Database | Neon PostgreSQL |

---

# 📂 Project Structure

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

---

# ⚙️ Local Setup

## 🔧 Backend Setup

### 1️⃣ Navigate To Backend

```bash
cd backend
```

### 2️⃣ Create Virtual Environment

```bash
python -m venv .venv
```

### 3️⃣ Activate Environment

#### Windows

```bash
.venv\Scripts\activate
```

#### Linux / Mac

```bash
source .venv/bin/activate
```

### 4️⃣ Install Dependencies

```bash
pip install -r requirements.txt
```

### 5️⃣ Configure Environment Variables

```bash
copy .env.example .env
```

### 6️⃣ Run Backend

```bash
uvicorn app.main:app --reload --port 8000
```

---

## 💻 Frontend Setup

### 1️⃣ Navigate To Frontend

```bash
cd frontend
```

### 2️⃣ Install Dependencies

```bash
npm install
```

### 3️⃣ Configure Environment

```bash
copy .env.example .env
```

### 4️⃣ Run Frontend

```bash
npm run dev
```

Open:

```text
http://localhost:5173
```

---

# 🔑 Configuration Notes

## Optional AI Setup

```env
OPENAI_API_KEY=
OPENAI_BASE_URL=
OPENAI_MODEL=

GEMINI_API_KEY=
GEMINI_MODEL=
```

---

## Optional Monitoring

```env
SENTRY_DSN=
VITE_SENTRY_DSN=
```

---

## ⚡ Fallback Logic Support

FairSplit AI continues functioning even without configured AI keys through deterministic local fallback logic.

This improves:
- reliability
- demo stability
- development convenience

---

# 📡 Key API Endpoints

## 🔐 Authentication

| Method | Endpoint |
| :--- | :--- |
| POST | `/signup` |
| POST | `/login` |
| GET | `/me` |

---

## 💸 Expense Splitting

| Method | Endpoint |
| :--- | :--- |
| POST | `/analyze-expense` |
| GET | `/history` |

---

## ✈️ Trip Planning

| Method | Endpoint |
| :--- | :--- |
| POST | `/plan-trip-budget` |
| POST | `/plan-trip-from-prompt` |
| POST | `/trips/generate` |
| GET | `/trips` |
| GET | `/trips/{trip_id}` |

---

## 🤖 Assistant & Integrations

| Method | Endpoint |
| :--- | :--- |
| POST | `/integrations/assistant-chat` |
| POST | `/integrations/travel-assistant` |
| POST | `/integrations/live-insights` |

---

## 🛠️ Admin APIs

| Method | Endpoint |
| :--- | :--- |
| GET | `/admin/users` |
| GET | `/admin/expenses` |
| GET | `/admin/reviews` |
| GET | `/admin/developer-profile` |
| PUT | `/admin/developer-profile` |

---

# 🧪 Example Expense Scenario

## Input

```text
We went to a restaurant. Total 1200.
Me and Arun ate full.
Ravi ate half.
Karthik didn't eat.
I paid.
```

---

## What FairSplit AI Extracts

- Total amount
- Participants
- Participation weights
- Payer information
- Settlement flow

---

## Example Settlement Outcome

```text
Arun owes ₹400
Ravi owes ₹200
Settlement generated successfully.
```

---

# 🧭 Product Positioning

FairSplit AI is intentionally designed as a:

# “Split-First Platform”

That means:
- expense clarity comes before everything else
- travel planning exists only to support budgeting
- the assistant remains practical and focused
- the user experience avoids unnecessary complexity

The platform prioritizes:
- simplicity
- transparency
- fairness
- conversational workflows

---

# 📘 User Manual

The complete user manual is available here:

```text
USER_MANUAL.md
```

The manual is also accessible from the live homepage through the **User Manual** button.

---

# 📈 Project Strengths

## ✅ Real-World Utility
Solves practical shared-finance problems faced by:
- friends
- students
- roommates
- travel groups

---

## ✅ AI + Full Stack Combination
Combines:
- AI workflows
- backend architecture
- frontend UX
- authentication
- live integrations

This gives the project strong portfolio value.

---

## ✅ Production-Style Structure
The backend follows scalable architecture practices using:
- routers
- schemas
- services
- models

This resembles real SaaS product organization.

---

## ✅ Strong Resume Value
FairSplit AI is highly suitable for showcasing skills related to:
- Full Stack Development
- AI Applications
- Backend Engineering
- Prompt Engineering
- Product-Oriented Development

---

# 📊 Overall Evaluation

| Area | Rating |
| :--- | :--- |
| Idea Originality | 9/10 |
| Technical Stack | 9/10 |
| Full-Stack Design | 9/10 |
| AI Integration | 8.5/10 |
| Resume Strength | 9.5/10 |
| Real-World Utility | 9/10 |
| Scalability Potential | 8.5/10 |

---

# 🔮 Future Vision

Planned future improvements include:
- collaborative live expense rooms
- WebSocket-based syncing
- advanced analytics
- Docker deployment support
- mobile application support
- smarter AI financial insights
- multi-currency settlement engine

---

# 🧑‍💻 Project Info

| Field | Details |
| :--- | :--- |
| Project Name | FairSplit AI |
| Version | V1.0 |
| Live Site | https://fairsplit-ai.pages.dev |
| Author | Dhavala V D M Adithya Naidu |

---

# 📜 License

This project is licensed under the MIT License.

---

<div align="center">

# ⭐ If You Like This Project, Give It A Star ⭐

### Built with AI, Full-Stack Engineering, and Product Thinking

</div>
