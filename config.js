// ─── Regulatory & Governance Sources ─────────────────────────────────────────

export const REGULATORY_SOURCES = [
  {
    id: "eu_ai_act",
    name: "EU AI Act",
    shortName: "EU AI Act",
    description: "European Union Artificial Intelligence Act — binding regulation covering risk classification, conformity assessment, and GPAI model obligations",
    searchQueries: [
      "EU AI Act implementation update 2025",
      "EU AI Act conformity assessment auditing",
      "EU AI Act notified body requirements",
      "EU AI Act high-risk system audit obligations",
      "EU AI Act GPAI enforcement 2025",
    ],
    auditRelevance: [
      "conformity assessment",
      "high-risk AI system auditing",
      "notified body accreditation",
      "post-market monitoring",
      "technical documentation review",
      "fundamental rights impact assessment",
    ],
  },
  {
    id: "nist_ai_rmf",
    name: "NIST AI RMF",
    shortName: "NIST RMF",
    description: "NIST AI Risk Management Framework and supporting publications — voluntary but widely adopted governance and assurance standard",
    searchQueries: [
      "NIST AI Risk Management Framework update 2025",
      "NIST AI RMF implementation guidance auditors",
      "NIST generative AI risk management profile",
      "NIST AI safety evaluation methods",
      "NIST AI trustworthiness assurance",
    ],
    auditRelevance: [
      "AI governance controls",
      "risk mapping and measurement",
      "bias and fairness testing",
      "AI system documentation",
      "accountability structures",
      "continuous monitoring",
    ],
  },
  {
    id: "sec_ai_governance",
    name: "SEC AI Governance",
    shortName: "SEC",
    description: "SEC guidance on AI-related disclosure, investment adviser AI use, and enforcement actions relevant to AI governance assurance",
    searchQueries: [
      "SEC artificial intelligence disclosure requirements 2025",
      "SEC AI washing enforcement audit",
      "SEC investment adviser AI governance obligations",
      "SEC cybersecurity AI risk internal controls",
      "SEC material AI risk audit committee",
    ],
    auditRelevance: [
      "AI-related material disclosures",
      "internal controls over AI claims",
      "audit committee AI oversight",
      "AI washing detection",
      "algorithmic trading controls",
    ],
  },
  {
    id: "iso_42001",
    name: "ISO/IEC 42001",
    shortName: "ISO 42001",
    description: "International standard for AI management systems — the primary certification framework for auditable AI governance programs",
    searchQueries: [
      "ISO 42001 AI management system certification 2025",
      "ISO IEC 42001 audit requirements",
      "ISO 42001 third party certification update",
      "ISO 42001 implementation guidance",
      "AI management system standard audit",
    ],
    auditRelevance: [
      "AI management system certification",
      "third-party audit requirements",
      "AI policy and objective setting",
      "supplier AI governance",
      "corrective action processes",
      "continual improvement auditing",
    ],
  },
  {
    id: "uk_ai_governance",
    name: "UK AI Governance",
    shortName: "UK DSIT",
    description: "UK DSIT AI Safety Institute, pro-innovation AI regulation framework, and sector-specific AI rules from FCA, ICO, and CQC",
    searchQueries: [
      "UK AI Safety Institute evaluation update 2025",
      "UK DSIT AI regulation guidance 2025",
      "UK FCA AI financial services governance",
      "UK ICO AI data protection audit",
      "UK AI assurance ecosystem",
    ],
    auditRelevance: [
      "AI safety evaluations",
      "sector-specific AI controls",
      "data protection impact assessments",
      "financial services AI governance",
      "AI assurance methodology",
    ],
  },
  {
    id: "us_state_ai_laws",
    name: "US State AI Laws",
    shortName: "State AI",
    description: "Emerging US state-level AI legislation — Colorado, Texas, Illinois, California, and others creating patchwork compliance obligations",
    searchQueries: [
      "US state AI law passed 2025",
      "Colorado AI Act SB 205 implementation",
      "California AI regulation audit requirement 2025",
      "Texas AI governance law 2025",
      "Illinois AI employment discrimination audit",
    ],
    auditRelevance: [
      "automated decision system audits",
      "algorithmic impact assessments",
      "employment AI bias auditing",
      "consumer-facing AI disclosures",
      "multi-state compliance mapping",
    ],
  },
  {
    id: "oecd_ai_governance",
    name: "OECD / Global AI Governance",
    shortName: "OECD / G7",
    description: "OECD AI Principles, G7 Hiroshima AI Process, and global governance developments shaping multinational AI audit standards",
    searchQueries: [
      "OECD AI principles update implementation 2025",
      "G7 AI governance code of conduct 2025",
      "global AI audit standard development",
      "AI governance interoperability framework",
      "international AI assurance standard",
    ],
    auditRelevance: [
      "cross-border AI compliance",
      "AI principles operationalization",
      "governance interoperability",
      "multinational audit programs",
      "voluntary commitment verification",
    ],
  },
];

// ─── Audit Perspectives ───────────────────────────────────────────────────────
// These are the professional roles and functions the report is written for.
// Each development is analyzed through each lens.

export const AUDIT_PERSPECTIVES = [
  {
    id: "ai_auditor",
    name: "AI Auditor",
    description:
      "Third-party or specialist auditors performing dedicated AI system audits, conformity assessments, and algorithmic impact evaluations",
    coreQuestions: [
      "What new audit scope or methodology requirements does this create?",
      "Does this require new technical competencies or tools?",
      "What evidence should be gathered and how?",
      "Does this affect independence, objectivity, or reporting requirements?",
    ],
    workstreams: [
      "conformity assessment",
      "algorithmic impact assessment",
      "bias and fairness testing",
      "AI system documentation review",
      "post-market monitoring",
    ],
  },
  {
    id: "internal_auditor",
    name: "Internal Auditor",
    description:
      "In-house internal audit functions at organizations that develop, procure, or deploy AI systems — responsible for assurance over AI governance controls",
    coreQuestions: [
      "What new control objectives should be added to the AI audit universe?",
      "Which AI risks now require assurance coverage?",
      "What should internal audit report to the audit committee on AI?",
      "How should the annual audit plan be adjusted?",
    ],
    workstreams: [
      "AI risk assessment",
      "control testing",
      "audit committee reporting",
      "third-party AI vendor oversight",
      "policy and procedure review",
    ],
  },
  {
    id: "compliance_officer",
    name: "Compliance & Risk Officer",
    description:
      "Chief Compliance Officers, Chief Risk Officers, and AI governance leads responsible for regulatory compliance programs and enterprise AI risk management",
    coreQuestions: [
      "What new compliance obligations arise from this development?",
      "What policies or procedures need updating?",
      "What is the deadline and who is responsible?",
      "What is the penalty or enforcement risk for non-compliance?",
    ],
    workstreams: [
      "regulatory horizon scanning",
      "policy management",
      "compliance program design",
      "regulatory reporting",
      "enforcement risk monitoring",
    ],
  },
];

// ─── Report Configuration ─────────────────────────────────────────────────────

export const REPORT_CONFIG = {
  title: "AI Regulatory & Governance Intelligence Report",
  subtitle: "For AI Auditors and Internal Audit Functions",
  outputDir: "./reports",
  formats: ["markdown", "html"],
  sections: [
    "breaking_alerts",
    "executive_summary",
    "developments_with_article_summaries",
    "audit_function_implications",
    "control_and_methodology_updates",
    "compliance_calendar",
  ],
  urgencyLevels: {
    critical: { label: "CRITICAL", emoji: "🔴", description: "Immediate action required" },
    high:     { label: "HIGH",     emoji: "🟠", description: "Action required this quarter" },
    medium:   { label: "MEDIUM",   emoji: "🟡", description: "Plan for next cycle" },
    low:      { label: "LOW",      emoji: "🟢", description: "Monitor" },
  },
};
