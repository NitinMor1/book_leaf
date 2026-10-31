/**
 * BookLeaf Publishing Official Knowledge Base & Tone Guidelines
 * Extracted directly from company operating documentation.
 */

export const BOOKLEAF_KNOWLEDGE_BASE = {
  company: {
    name: "BookLeaf Publishing",
    description: "Self-publishing company operating in India and the US, processing 1,200+ books monthly across a catalog of 22,000+ titles.",
    packages: [
      {
        name: "Standard Free",
        details: "No upfront cost; full publishing support including cover design, typesetting, ISBN assignment, printing, and distribution."
      },
      {
        name: "Bestseller Breakthrough",
        details: "Premium paid package featuring tailored marketing, guaranteed distribution add-ons, and promotional campaigns."
      }
    ],
    facilities: "In-house printing facility and central warehouse located in Delhi, India. Verified print partners include Repro India and Epitome Books.",
    services: [
      "Cover Design",
      "Typesetting & Formatting",
      "Proofreading & Editing",
      "ISBN Assignment & Imprint Registration",
      "Print-on-Demand & Bulk Printing",
      "Global & Domestic Distribution",
      "Quarterly Royalty Management"
    ]
  },

  royaltyPolicy: {
    split: "80/20 net profit split: 80% to the author, 20% to BookLeaf Publishing.",
    netProfitFormula: "Net Profit = MRP - (Printing Cost + Platform Commission [Amazon/Flipkart] + Shipping Charges).",
    payoutCycle: "Royalties are calculated quarterly and distributed within 45 days after the close of the quarter.",
    minimumThreshold: "₹1,000 minimum payout threshold. If accumulated royalties are below ₹1,000, they automatically roll over to the next quarter.",
    payoutMethod: "Direct Bank Transfer (NEFT/IMPS) to the verified bank account linked in the author dashboard.",
    transparency: "Authors can view a line-by-line royalty breakdown in their dashboard showing exact sales figures per distribution platform."
  },

  isbnPolicy: {
    assignment: "Every book published through BookLeaf receives a unique ISBN assigned by BookLeaf, registered under BookLeaf's publisher imprint.",
    independentImprint: "If an author prefers an ISBN under their own personal imprint, they must procure it independently and provide details prior to formatting.",
    discrepancyResolution: "Any ISBN or metadata mismatch reported (duplicate, wrong title linked on retail portals) is treated as Critical/High priority and escalated to the production team with a strict 48-hour resolution timeline."
  },

  printingAndQuality: {
    facilities: "Delhi in-house printing plant handles primary fulfillment; overflow and specialized bindings handled by Repro India or Epitome Books.",
    turnaround: "Standard print turnaround is 5–7 business days from order confirmation.",
    defectGuarantee: "If an author reports physical defects (misprints, binding defects, defective spine, or color inconsistency), BookLeaf arranges a complimentary free reprint upon photo verification. Verification is expedited within 24–48 hours."
  },

  distributionAndAvailability: {
    channels: ["Amazon India", "Flipkart", "Amazon US", "Amazon UK", "BookLeaf Store"],
    goLiveTimeline: "New retail listings typically go live within 7–10 business days after publication is finalized.",
    outOfStockOrUnavailable: "If a title shows 'Currently Unavailable' on Amazon or Flipkart, it usually indicates an automated API stock/inventory sync issue. BookLeaf's operations team can trigger a manual distribution re-sync within 24–48 hours."
  },

  productionStages: [
    "Manuscript Received",
    "Editing (if opted)",
    "Cover Design (approval required by author)",
    "Typesetting",
    "Proofreading (author revision rounds)",
    "ISBN Assignment",
    "Printing",
    "Distribution Setup",
    "Published & Live"
  ],

  toneGuidelines: [
    "Always empathetic and professional. Authors are creative partners, not customers to be managed.",
    "Acknowledge the author's concern and validate their feelings before providing answers.",
    "Be specific: cite exact book titles, ISBNs, royalty figures, sales numbers, and dates whenever available.",
    "Direct ownership: if an issue stems from BookLeaf (delayed royalties, sync glitch, print defect), acknowledge it immediately with zero corporate deflection.",
    "Definitive commitments: provide clear investigation timelines (e.g., 'Our production team will resolve this within 48 hours') rather than open-ended promises.",
    "Clear next steps: always conclude every response with an actionable next step for the author or a confirmation of what BookLeaf is doing."
  ]
};

export const CATEGORIES = [
  "Royalty & Payments",
  "ISBN & Metadata Issues",
  "Printing & Quality",
  "Distribution & Availability",
  "Book Status & Production Updates",
  "General Inquiry"
] as const;

export type TicketCategoryType = (typeof CATEGORIES)[number];

export const PRIORITIES = ["Critical", "High", "Medium", "Low"] as const;
export type TicketPriorityType = (typeof PRIORITIES)[number];

export const STATUSES = ["Open", "In Progress", "Resolved", "Closed"] as const;
export type TicketStatusType = (typeof STATUSES)[number];
