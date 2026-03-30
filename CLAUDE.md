# Qanun Development Rules

## Sprint Protocol
- All development follows binary pass/fail sprint gates
- No sprint advances without all tests passing
- Run `pytest` before declaring any sprint complete

## Architecture
- Backend: FastAPI (Python 3.12+), deployed on Hetzner via Coolify
- Frontend: Next.js on Vercel
- Database: SQLite (dev), Postgres on Hetzner via Coolify (production)
- Pipeline: 10-agent MALIS, invoked via asyncio.create_task
- Orchestrator uses a state dict
- Auth: NextAuth, session token via session?.user?.accessToken
- Vector store: Pinecone with voyage-law-2 embeddings
- All agent nodes synchronous, direct Anthropic SDK throughout
- Corpus package named adgm_corpus
- Relations table uses entity_a/entity_b
- Pinecone stores "" for effective_to on current records

## Design System
- See .claude/skills/design-system/SKILL.md for full spec
- Navy #0B1829, Gold #C4922A, Teal #0F7A5F
- Inter font, weights 400/600 only
- Lucide icons, strokeWidth 1.5
- No gradients. No border-radius >16px.
- Dark, minimal, editorial aesthetic

## Multi-Jurisdiction Positioning
- ADGM depth claims = evidence of corpus quality, never scope-defining language
- Jurisdiction-neutral framing across ADGM/FSRA, DIFC/DFSA, VARA
- Two-product brand architecture: Research (gold), Studio (teal #0F6E56)

## Reference Files
- Design system: .claude/skills/design-system/SKILL.md
- Regulatory vocab: .claude/rules/regulatory-vocab.md
- Sprint protocol: .claude/rules/sprint-protocol.md
