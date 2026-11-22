# Farmer Right
## (Rythu Hakku) — Claim What's Yours

**ACE Builders 2026 · Problem Statement 5 — Citizens & Public Services**
**Solo build · React + Vite + Tailwind CSS · Frontend-only · Free to use, forever**

**Live:** https://farmer-right.onrender.com
**Repo:** https://github.com/siva071/farmer-right

Farmer Right (Rythu Hakku) helps small farmers in Andhra Pradesh find out which government schemes they likely qualify for — in plain English and Telugu, in two minutes, without paying a middleman and without sharing Aadhaar or bank details.

> "Middlemen ki ₹500 ivvalsina pani ledhu — free ga, Telugu lo, 2 nimishallo."

## The problem

Crores of eligible farmers miss benefits they are entitled to, because scheme rules are written in English, scattered across portals, and explained by middlemen who charge for help that should be free. A tenant farmer is told "you get nothing" — when in fact, with a CCRC card, the state owes him the full ₹20,000 a year under Annadata Sukhibhava.

## What it does

1. **Plain-language input** — 8 quick questions in English (Telugu toggle), one per screen, tap to answer. Tenant farmers get one extra question — "Do you have a CCRC card?" — so 9 in the tenant path. A free-text box — "Tell us about yourself" — catches anything the questions miss.
2. **Voice help** — the Home page asks "Do you need voice help?" If Yes, the whole flow runs in voice: each question is read aloud, the options are read aloud, and saying "option 1" (or the option itself) selects it — no mic tap needed, listening starts automatically. "Listen to summary" on Results speaks the full details: every scheme's status, amount, why, documents still needed and deadlines, plus the total benefit. Telugu speech uses the phone's Telugu voice when installed; otherwise it says so and speaks in English.
3. **Matching with reasoning** — every scheme shows WHY it matches, or the exact rule that blocks it, plus what to FIX. "Likely eligible" is always shown as likely, never guaranteed.
4. **Total benefit number** — the farmer sees their yearly cash total (e.g. ₹20,000/year for a tenant with CCRC).
5. **Blocker dashboard** — "Fix these first — ₹X/year blocked", ranked by money at stake.
6. **Personalised document checklist** — split Ready / Still needed, per scheme.
7. **Application tracking** — a manual "Mark as applied" toggle on each Likely and May-be scheme card, saved in the browser (localStorage), with an "Applied" chip on the card and an applied count (e.g. "2 of 5 applied") in the checklist header. No auto-tracking, no API — the farmer marks it themselves.
8. **Step-by-step apply guide + official link + last-verified date** for every scheme.
9. **Deadline countdown** — e.g. PMFBY enrolment closes 15 Dec 2026 (23 days left on 22 Nov 2026).
10. **Status decoder** — "Why didn't my ₹2,000 come?" maps eKYC / land-seeding / NPCI status to the office and document that fixes it.
11. **Helper mode** — "I help farmers" for family members or volunteers helping a farmer.
12. **Printable one-page checklist** (opens in a new tab) to take to the Rythu Seva Kendram (RSK).
13. **Scam guardrail on every screen** — "Applying is free — never pay anyone".
14. **Who pays** — "Free for the farmer, forever — NGOs, CSR, banks pay".
15. **4 sample personas, one tap** — Ramesh (owner, Chittoor), Lakshmi (woman, SC, Anantapur), Venkatesh (tenant with CCRC, Kadapa), Kiran (IT job, inherited land).

## The demo moment

Venkatesh, 52, Kadapa — 6 acres, tenant farmer, holds a CCRC card.

- **PM-KISAN says No** — "Land must be in your own name (pattadar)".
- **Annadata Sukhibhava says YES — full ₹20,000/year from the state** (tenant route, CCRC + e-Panta). The app knows the difference.

## Schemes covered (9)

| Scheme | Benefit | Key rule |
|---|---|---|
| PM-KISAN | ₹6,000/year | Owners only; excludes income-tax payers, govt employees (except Group D/MTS), professionals |
| Annadata Sukhibhava | ₹20,000/year | Owners ₹14,000 + ₹6,000 PM-KISAN (≥10 cents); tenants with CCRC get full ₹20,000 from the state |
| PMFBY crop insurance | Insurance cover | Notified crop in notified area; enrol before cut-off (Kharif 2%, Rabi 1.5%, horticulture 5% premium) |
| KCC loan | Up to ₹5 lakh | 4% effective rate only up to ₹3 lakh/year; collateral-free to ₹2 lakh |
| Soil Health Card | Free 12-parameter test | Any farmer; 2-year cycle |
| PM-KUSUM Component B | Solar pump | **Not open now** — Phase 1 ended 31 Mar 2026; waitlist / check NREDCAP |
| Micro-irrigation (APMIP) | Drip up to 100% | AP rates per G.O.Ms.No.82 (not central 55%/45%) |
| SMAM machinery | 50% / 40% | 50% SC/ST, small/marginal, women; 40% others |
| YSR Rythu Bharosa | — | **No longer active** — replaced by Annadata Sukhibhava |

All scheme rules live in `public/schemes.json` (editable data, as the problem statement asks). All figures verified against official sources in November 2026; each scheme links to its official portal with a last-verified date ("Last verified Nov 2026").

## Tech

- **Frontend:** React + Vite + Tailwind CSS, Noto Sans Telugu
- **No backend, no database, no login** — matching runs in the browser; tracking in localStorage
- **Voice:** Web Speech API (free, in-app)
- **Data:** `public/schemes.json` — every rule is editable data
- **Deploy:** Render (free tier, static site, auto-deploy from `main`)

## Run it

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 8 engine tests
npm run build    # production build
```

## Guardrails (built in, not bolted on)

- "Likely eligible", never "guaranteed"
- No Aadhaar number, bank number, or sensitive ID collected — ever
- Scheme rules stored as editable data (they change often)
- Tested only with sample profiles

## Business viability

Free for the farmer, forever. Paid for by the people who benefit when a farmer gets their scheme: NGOs and CSR funds (their field workers use it), banks (KCC/PMFBY enrolments), and service centres. No farmer ever pays.

---

Built at ACE Builders 2026 (21–22 Nov 2026) by Bonthala Siva Shankar, solo.
