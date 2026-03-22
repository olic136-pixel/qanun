# QANUN Demo Flow

## Pre-demo checklist

- [ ] API running: `cd ~/ADGM/qanun-api && ./startup.sh`
- [ ] ngrok running: `ngrok start qanun-api` (separate terminal)
- [ ] Frontend running: `cd ~/qanun && npm run dev`
- [ ] Sign in: localhost:3000/sign-in → demo@qanun.ai / qanun-demo-2026

## Demo narrative (12 minutes)

### 1. Landing page (1 min)

- localhost:3000 — "The law, decoded. Wherever you operate."
- Market status strip: LIVE / COMING SOON / PLANNED
- Pricing page: three tiers, 14-day trial

### 2. Dashboard (2 min)

- Sign in → dashboard
- QUICK LOOKUP: type "What is a Category 3A licence under PRU 1.3.3?"
- Answer appears inline in ~10 seconds with [PRU 1.3.3(1)] citation
- Click the citation — corpus panel slides in with exact rule text
- Product twins: Fuutura (green), TradeDar (amber/2 alerts), Fuutura ES (green)
- "For in-depth analysis →" link to Research

### 3. Research pipeline (4 min)

- Navigate to Research
- Type: "What are the conditions for a Category 3A licence and does a dual-entity CFD structure satisfy them?"
- Click "Start research →"
- Watch pipeline: "MALIS pipeline processing..." (60-90 seconds)
- Show analysis: structured research note with headings, tables
- Click PRU citation — corpus panel with exact provision
- Claims panel: VERIFIED / SUPPORTED / INFERRED / SPECULATIVE badges
- Click "Export memo" — downloads .txt file

### 4. Product twins and alerts (2 min)

- /twins — TradeDar has amber border + "2 alerts"
- /alerts — COBS 23.12.2 alert, expand, show description
- "The system monitors your regulatory obligations continuously"

### 5. Sessions history (1 min)

- /sessions — 17+ sessions
- Click a session — loads stored analysis immediately (no re-run)

### 6. Corpus browser (1 min)

- /corpus — search "matched principal"
- PRU rulebook results with section counts

### 7. Close (1 min)

- Back to dashboard
- "QANUN replaces the first 4 hours of every regulatory research task"
- Professional tier: $349/mo · Enterprise: custom

## Key numbers

- 2,484 corpus documents · 63,397 sections
- 10-agent MALIS pipeline
- ADGM, DIFC, El Salvador live
- Saudi CMA, Mauritius FSC, Pakistan SECP, Bahrain CBB — Wave 2 2026

## Demo credentials

- URL: localhost:3000 (local) or qanun.vercel.app (production)
- Email: demo@qanun.ai
- Password: qanun-demo-2026
