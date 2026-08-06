# 🏠 SmartKeja — Nairobi Property Recommendation System

A knowledge-based property recommendation system for Nairobi, combining a
**rule-based forward-chaining engine** with a **fuzzy-logic + NLP
conversational assistant** — two distinct inference strategies working
side by side over the same real, geocoded Nairobi property dataset.

**"Keja"** is Kenyan slang for "place" / "home" — SmartKeja helps you find
yours, by typing, clicking filters, or just talking to it.

---

## 🌐 Live Demo

| | |
|---|---|
| **Frontend (SmartKeja)** | https://kbs-property-recommendation.vercel.app |
| **Fuzzy-Logic + Chat API** | https://kbs-fastapi.onrender.com (docs: [`/docs`](https://kbs-fastapi.onrender.com/docs)) |
| **Rule-Based Engine API** | https://kbs-flask.onrender.com |
| **Source code** | https://github.com/NatanTezare/kbs-property-recommendation |

> Note: both backends are hosted on Render's free tier, which spins down
> after inactivity — the first request after a period of idle time may
> take 30–60 seconds to wake up. This is expected, not a bug.

---

## ✨ Features

- **Browse & filter** 115 real Nairobi listings (rent & sale) with photos,
  price, bedrooms, security rating, distance to CBD, and amenities
- **Recommendations engine** — form-based search scored by budget, location,
  and bedroom fit
- **Sema — AI chat assistant** — a floating conversational widget available
  on every page:
  - Natural language understanding — *"2 bedroom apartment in Kilimani to
    rent under 150k with good security"*
  - **Multi-turn memory** — follow-up refinements like *"make it cheaper"*,
    *"closer to town"*, or *"tell me more about the first one"* work
    without repeating yourself
  - **Voice in and out** — speak your query via the browser's speech
    recognition, and hear results read back aloud
  - Every recommendation comes with a plain-language explanation of *why*
    it was ranked where it was

---

## 🧠 Two Inference Engines, One Dataset

This project intentionally implements **two different classical AI
reasoning strategies**, rather than picking one, to demonstrate both
approaches taught in the course:

### 1. Rule-Based Forward-Chaining Engine (Flask)
Evaluates properties against a set of explicit, crisp rules — a match
either satisfies a rule or it doesn't. Powers the standard property
browsing and filtered-recommendations pages.

### 2. Fuzzy-Logic Inference Engine + Conversational NLP (FastAPI)
Rather than hard filters, each criterion (budget, distance, bedroom count,
security, location) is represented as a **fuzzy membership function**
returning a degree of fit between 0 and 1, combined via **weighted
aggregation** into an overall confidence score. This means a property 5%
over budget with excellent security can still rank well against one that's
exactly on budget but poorly located — a nuance crisp rule-based systems
can't express. Layered on top is a **dialogue manager** that maintains
conversation memory across turns, resolves references ("the first one"),
detects relative refinements ("cheaper", "closer"), and generates natural
language replies — the "Sema" chat assistant.

**One deliberate design decision worth noting:** Rent vs. Sale is treated
as a **hard categorical filter**, not a fuzzy one, even though almost
every other criterion is fuzzy. A property for sale genuinely cannot
"partially" satisfy someone who wants to rent — recognizing which
distinctions are real matters of degree and which are true category
boundaries was itself part of the design process (and an early bug we
caught and fixed: see [Known Issues & Debugging](#-known-issues--things-we-debugged-along-the-way)).

---

## 🗂️ Project Structure

```
kbs-property-recommendation/
├── api.py                  # FastAPI app — fuzzy engine + chat endpoints
├── models.py                # Property data loading & normalization
├── nlp_parser.py             # Free-text query → structured intent
├── dialogue.py                # Multi-turn conversation memory & NLG
├── fuzzy_engine.py             # Fuzzy membership functions + ranking
├── main.py                      # Flask app — rule-based forward-chaining engine
├── requirements.txt               # Python dependencies (both backends)
├── properties.json                 # Knowledge base (115 properties)
├── KnowledgeBase_Geocoded_115.csv   # Source dataset with coordinates
├── *.png / *.webp                    # Property photos (115 listings)
└── frontend/                          # React + Vite + Tailwind app
    ├── src/
    │   ├── components/
    │   │   ├── ChatAssistant.jsx        # Sema floating chat widget
    │   │   ├── Layout.jsx                 # Site shell, nav, theme
    │   │   └── PropertyCard.jsx            # Listing card
    │   ├── pages/
    │   │   ├── ListingPage.jsx              # Browse all properties
    │   │   └── RecommendationsPage.jsx       # Filtered search
    │   ├── utils/normalizeProperty.js         # Backend → UI data shape
    │   └── api/recommendations.js              # Flask API client
    └── package.json
```

---

## ⚙️ Running It Locally

You need three things running: two backends and the frontend.

### 1. Fuzzy-logic + chat backend (FastAPI)
```bash
pip install -r requirements.txt
python -m uvicorn api:app --reload --port 8000
```
Check it: http://localhost:8000/health

### 2. Rule-based backend (Flask)
```bash
python main.py
```
Runs on http://localhost:5000

### 3. Frontend
```bash
cd frontend
npm install
npm run dev
```
Open the URL Vite prints (usually http://localhost:5173).

> The deployed version points the frontend at the live Render URLs above.
> For local development, the frontend's API base URLs need to be switched
> back to `localhost` — see `ChatAssistant.jsx`, `recommendations.js`, and
> `ListingPage.jsx`.

---

## 📡 API Reference

### FastAPI (fuzzy engine + chat) — https://kbs-fastapi.onrender.com

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | Liveness check + property count |
| GET | `/estates` | List of known estate names |
| GET | `/properties` | List/filter raw properties |
| POST | `/recommend` | One-shot natural language query → ranked results |
| POST | `/chat` | **Conversational** — remembers context via `session_id` |
| POST | `/match` | Structured (form-based) matching — used by the Recommendations page's chat integration |

Full interactive docs: https://kbs-fastapi.onrender.com/docs

### Flask (rule-based engine) — https://kbs-flask.onrender.com

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/properties` | List all properties |
| POST | `/api/recommendations` | Rule-based filtered recommendations |

---

## 📊 Dataset

115 real Nairobi property listings covering both rental and sale markets,
with:
- Price, bedrooms, bathrooms, size, property type, listing type
- Estate, sub-location, county, and geocoded latitude/longitude
- Security rating, amenities (pool, gym, parking, pets, furnished, etc.)
- Distance to CBD, traffic/noise/flood-risk indicators
- A real photo per listing

Source: `KnowledgeBase_Geocoded_115.csv` → converted to `properties.json`
via `convert.py`.

---

## 🐛 Known Issues & Things We Debugged Along the Way

Worth documenting honestly, since this is exactly the kind of testing and
debugging process the course asks about:

- **Bare-number budget misparsing** — the NLP parser originally read the
  "3" in *"I want 3 br"* as a budget of KES 3. Fixed by requiring an
  explicit currency signal (KES/Ksh) or magnitude unit (k/thousand/million)
  before treating any number as a budget.
- **"5km" silently became a budget of 5,000** — a missing word-boundary in
  the unit-matching regex let "k" inside "km" match as a currency unit.
  Fixed with proper `\b` boundaries.
- **Qualifier amnesia** — "under 30k" was being silently reset to a
  meaningless default "around" on the very next turn, even when that turn
  had nothing to do with budget. Fixed by only updating the qualifier when
  a number is actually detected that turn.
- **Rent vs. Sale dilution** — Sale properties were initially just another
  fuzzy-weighted criterion, meaning a 15M sale listing could still rank
  highly in a "rent under 150k" conversation once other criteria
  outweighed it. Fixed by treating listing type as a hard pre-filter
  (see [design note above](#-two-inference-engines-one-dataset)) — a
  genuinely categorical distinction shouldn't be able to get "voted down."

---

## 👥 Team & GitHub Collaboration

| Contributor | Focus |
|---|---|
| **Natan Tezare** ([@NatanTezare](https://github.com/NatanTezare)) | Fuzzy-logic inference engine, NLP query parsing, conversational dialogue manager, FastAPI backend, chat assistant integration, deployment |
| **githinjiEssy** | React frontend, rule-based forward-chaining engine, Flask backend |
| **Lycaan** | Initial project structure, knowledge base setup, dataset/image integration |

Full commit history, feature branches, and merged pull requests are
visible in the repository's commit graph and closed PRs.

---

## 🛠️ Tech Stack

**Backend:** Python, FastAPI, Flask, Pydantic, pandas
**Frontend:** React 19, Vite, Tailwind CSS, react-router-dom, lucide-react
**Inference:** Custom fuzzy-logic membership functions, rule-based
forward-chaining, regex/gazetteer-based NLP
**Voice:** Web Speech API (SpeechRecognition + SpeechSynthesis)
**Deployment:** Render (backends), Vercel (frontend)
**Data:** CSV knowledge base → JSON, geocoded with real coordinates

---

## 📄 Course Context

Built for a Knowledge-Based Systems course project (Property Recommendation
System track). See assessment breakdown: problem definition & domain
knowledge, knowledge acquisition & representation, inference engine &
reasoning, system functionality & usability, documentation, GitHub
collaboration, and presentation/demonstration.
