---
description: "Activates when working with regulatory provisions, ADGM/FSRA/DIFC/DFSA/VARA rules, corpus queries, or compliance analysis. Provides vocabulary mapping and retrieval guidance."
---

# Regulatory Analysis Skill

## Corpus Retrieval Rules
- Use get_rule with exact citations (e.g., "COBS 3.2.1") for reliable retrieval
- Avoid broad search_corpus queries — they return noise
- The enhance_query() function in quicklookup.py is the critical translation layer
- Always inject UK regulatory vocabulary equivalents for ADGM terms

## Vocabulary Mapping (UK → ADGM)
- FCA → FSRA (Financial Services Regulatory Authority)
- PRA → Not applicable (ADGM is single-regulator)
- FIT → GEN (General Rules)
- SYSC → GEN Chapter 3 (Systems and Controls)
- COBS → COBS (same abbreviation, different rulebook)
- SUP → GEN Chapter 8 (Supervision)

## Jurisdiction Awareness
- ADGM: Abu Dhabi, FSRA-regulated, common law, 63,397 provisions in corpus
- DIFC: Dubai, DFSA-regulated, common law
- VARA: Dubai, virtual assets specific
- El Salvador: CNAD for DASP licensing, BCR for BSP registration

## Standing Instructions
- ADGM depth claims are evidence of corpus quality
- NEVER use ADGM depth as scope-defining language in multi-jurisdiction context
- Always frame jurisdiction coverage as "live markets" not "supported jurisdictions"
