/**
 * Maps governance document register IDs to drafting engine template slugs.
 *
 * Template slugs must match doc_type values in TEMPLATE_REGISTRY
 * (qanun-api/services/drafting_templates.py).
 *
 * null = template not yet built; Draft button should show "Coming soon".
 *
 * 23 templates exist. 62 documents are draftable. ~39 map to null.
 */
export const DOCUMENT_TEMPLATE_MAP: Record<string, string | null> = {
  // ── GOVERNANCE (GOV-002 to GOV-008, GOV-001 not draftable) ──
  'GOV-002': 'board_governance_charter',       // Board Terms of Reference
  'GOV-003': null,                             // Delegation of Authority Matrix
  'GOV-004': null,                             // Corporate Governance Statement
  'GOV-006': null,                             // Board Meeting Pack Template
  'GOV-007': null,                             // Board Minutes Template
  'GOV-008': 'terms_of_reference_committees',  // Committee TORs

  // ── COMPLIANCE (COMP-001 to COMP-011) ──
  'COMP-001': 'compliance_manual',
  'COMP-002': 'compliance_monitoring_programme',
  'COMP-003': null,                            // Compliance Officer Job Description & TOR
  'COMP-004': null,                            // Breaches & Incidents Register
  'COMP-005': 'conflicts_policy',
  'COMP-006': null,                            // Gifts & Entertainment Policy
  'COMP-007': null,                            // Personal Account Dealing Policy
  'COMP-008': null,                            // Regulatory Notifications Procedure
  'COMP-009': null,                            // Complaints Handling Policy
  'COMP-010': 'whistleblowing_policy',
  'COMP-011': null,                            // Annual Compliance Report

  // ── AML/CFT (AML-001 to AML-011) ──
  'AML-001': 'aml_cft_policy',
  'AML-002': 'business_risk_assessment',
  'AML-003': null,                             // Customer Risk Assessment Methodology
  'AML-004': 'kyc_cdd_procedures',             // CDD/EDD/SDD Procedures
  'AML-005': null,                             // Sanctions Screening Policy
  'AML-006': null,                             // Suspicious Activity Reporting Procedure
  'AML-007': null,                             // MLRO Job Description & TOR
  'AML-008': null,                             // MLRO Annual Report
  'AML-009': null,                             // AML/CFT Training Plan
  'AML-010': null,                             // Correspondent Banking Policy
  'AML-011': null,                             // Annual AML Return Checklist

  // ── RISK (RISK-001 to RISK-004) ──
  'RISK-001': 'risk_management_policy',        // Enterprise Risk Management Framework
  'RISK-002': null,                            // Risk Appetite Statement
  'RISK-003': null,                            // Risk Register
  'RISK-004': 'icaap',                         // ICAAP / Capital Adequacy Self-Assessment

  // ── OPERATIONS (OPS-001 to OPS-007) ──
  'OPS-001': 'business_continuity_plan',
  'OPS-002': 'cyber_risk_framework',
  'OPS-003': null,                             // Information Security Policy
  'OPS-004': null,                             // Data Protection Policy & DPIA
  'OPS-005': 'outsourcing_policy',
  'OPS-006': null,                             // Record Retention & Destruction Policy
  'OPS-007': null,                             // Incident Response Procedure

  // ── COMMERCIAL (CLI-001 to CLI-011, CLI-004 not draftable) ──
  'CLI-001': 'client_agreement_tob',           // Client Agreement (Professional)
  'CLI-002': null,                             // Client Agreement (Retail) — separate template TBD
  'CLI-003': null,                             // Risk Disclosure Statement
  'CLI-005': null,                             // Client Categorisation Policy
  'CLI-006': 'suitability_policy',             // Suitability / Appropriateness
  'CLI-007': null,                             // Client Money Handling Procedures
  'CLI-008': 'custody_agreement',              // Safe Custody Arrangements
  'CLI-009': null,                             // Marketing & Financial Promotions Policy
  'CLI-010': null,                             // Best Execution Policy
  'CLI-011': null,                             // Order Handling & Allocation Policy

  // ── HR / PEOPLE (HR-001 to HR-005) ──
  'HR-001': null,                              // Approved Persons Fit & Proper Template
  'HR-002': null,                              // Training & Competency Scheme
  'HR-003': null,                              // Code of Conduct
  'HR-004': null,                              // Remuneration Policy
  'HR-005': 'succession_plan',

  // ── FINANCIAL (FIN-002 to FIN-005, FIN-001 not draftable) ──
  'FIN-002': null,                             // Capital Adequacy Monitoring Procedures
  'FIN-003': null,                             // Regulatory Returns Preparation
  'FIN-004': null,                             // Client Money Reconciliation
  'FIN-005': null,                             // Auditor Engagement

  // ── FUNDS (FUND-001, FUND-003 to FUND-005, FUND-002 not draftable) ──
  'FUND-001': null,                            // Fund Prospectus / OM
  'FUND-003': null,                            // Investment Management Agreement
  'FUND-004': null,                            // Valuation Policy
  'FUND-005': null,                            // Subscription / Redemption Procedures
}

/**
 * Check if a document has a drafting template available.
 */
export function hasTemplate(documentId: string): boolean {
  return DOCUMENT_TEMPLATE_MAP[documentId] != null
}

/**
 * Get the template slug for a document, or null if not available.
 */
export function getTemplateSlug(documentId: string): string | null {
  return DOCUMENT_TEMPLATE_MAP[documentId] ?? null
}
