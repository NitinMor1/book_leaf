import { GoogleGenerativeAI } from '@google/generative-ai';
import { BOOKLEAF_KNOWLEDGE_BASE, CATEGORIES, PRIORITIES, TicketCategoryType, TicketPriorityType } from '../config/kb.js';

export interface AuthorContext {
  name: string;
  email: string;
  city?: string | null;
}

export interface BookContext {
  id: string;
  title: string;
  isbn: string;
  genre: string;
  status: string;
  mrp: number | null;
  authorRoyaltyPerCopy: number | null;
  totalCopiesSold: number;
  totalRoyaltyEarned: number;
  royaltyPaid: number;
  royaltyPending: number;
  lastRoyaltyPayoutDate: Date | null;
  printPartner: string | null;
  availableOn: string;
}

export interface AIClassificationResult {
  category: TicketCategoryType;
  priority: TicketPriorityType;
  reasoning: string;
}

/**
 * Intelligent Rule-based Heuristic Fallback Engine
 * Ensures 100% uptime, zero crashes, and instant response even when
 * third-party LLM APIs are unreachable, unconfigured, or rate-limited.
 */
function heuristicClassifyAndScore(subject: string, description: string): AIClassificationResult {
  const text = `${subject} ${description}`.toLowerCase();

  // Category Detection
  let category: TicketCategoryType = 'General Inquiry';
  let priority: TicketPriorityType = 'Low';
  let reasoning = 'Standard author inquiry';

  if (
    text.includes('royalt') ||
    text.includes('payout') ||
    text.includes('payment') ||
    text.includes('earning') ||
    text.includes('bank') ||
    text.includes('rupee') ||
    text.includes('money') ||
    text.includes('rs.') ||
    text.includes('₹')
  ) {
    category = 'Royalty & Payments';
    if (text.includes('not received') || text.includes('months') || text.includes('pending') || text.includes('delay') || text.includes('never')) {
      priority = 'High';
      reasoning = 'Detected unresolved royalty delay or payment escalation query';
    } else {
      priority = 'Medium';
      reasoning = 'General inquiry regarding royalty calculations or payout threshold';
    }
  } else if (
    text.includes('isbn') ||
    text.includes('imprint') ||
    text.includes('barcode') ||
    text.includes('metadata') ||
    text.includes('wrong book') ||
    text.includes('mismatch')
  ) {
    category = 'ISBN & Metadata Issues';
    priority = 'Critical';
    reasoning = 'Catalog metadata or ISBN discrepancy identified across retail channels; requires immediate production intervention';
  } else if (
    text.includes('print') ||
    text.includes('binding') ||
    text.includes('misprint') ||
    text.includes('defect') ||
    text.includes('quality') ||
    text.includes('blurry') ||
    text.includes('damaged') ||
    text.includes('pages torn') ||
    text.includes('spine')
  ) {
    category = 'Printing & Quality';
    priority = 'High';
    reasoning = 'Physical printing or author copy defect reported; qualifies for free reprint inspection';
  } else if (
    text.includes('unavailable') ||
    text.includes('out of stock') ||
    text.includes('amazon') ||
    text.includes('flipkart') ||
    text.includes('listing') ||
    text.includes('live') ||
    text.includes('store') ||
    text.includes('sync')
  ) {
    category = 'Distribution & Availability';
    priority = 'Medium';
    reasoning = 'Retail channel inventory synchronization or listing visibility issue';
  } else if (
    text.includes('typesetting') ||
    text.includes('proofreading') ||
    text.includes('cover') ||
    text.includes('stage') ||
    text.includes('manuscript') ||
    text.includes('progress') ||
    text.includes('editing') ||
    text.includes('production')
  ) {
    category = 'Book Status & Production Updates';
    if (text.includes('delayed') || text.includes('weeks') || text.includes('stuck') || text.includes('waiting')) {
      priority = 'High';
      reasoning = 'Author experiencing delayed workflow milestone during active book production';
    } else {
      priority = 'Medium';
      reasoning = 'Author requested milestone status on manuscript production lifecycle';
    }
  }

  // Critical escalation check
  if (text.includes('urgent') || text.includes('critical') || text.includes('legal') || text.includes('lawyer') || text.includes('complaint')) {
    priority = 'Critical';
    reasoning += ' (Escalated due to urgency keywords)';
  }

  return { category, priority, reasoning };
}

/**
 * Intelligent Rule-based Knowledge-Grounded Draft Generator
 * Produces authentic BookLeaf tone compliant drafts without hallucination.
 */
function heuristicDraftResponse(
  category: TicketCategoryType,
  subject: string,
  description: string,
  author: AuthorContext,
  book?: BookContext | null
): string {
  const authorFirstName = author.name.split(' ')[0] || author.name;
  const bookTitle = book?.title ? `'${book.title}'` : 'your publication';

  switch (category) {
    case 'Royalty & Payments': {
      const pending = book?.royaltyPending !== undefined ? `₹${book.royaltyPending.toLocaleString('en-IN')}` : 'your pending royalties';
      const lastPayout = book?.lastRoyaltyPayoutDate
        ? new Date(book.lastRoyaltyPayoutDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
        : null;

      return `Dear ${authorFirstName},

Thank you for reaching out to us regarding your royalty inquiry for ${bookTitle}.

At BookLeaf Publishing, we follow an 80/20 net profit split: 80% goes directly to you as the author. Our royalties are calculated on a quarterly basis and disbursed within 45 days of the quarter ending, subject to our minimum payout threshold of ₹1,000.
${book ? `\nAccording to our records for ${bookTitle}:\n- Total copies sold: ${book.totalCopiesSold}\n- Total royalty earned: ₹${book.totalRoyaltyEarned.toLocaleString('en-IN')}\n- Royalty already paid: ₹${book.royaltyPaid.toLocaleString('en-IN')}${lastPayout ? ` (Last payout: ${lastPayout})` : ''}\n- Current pending balance: ${pending}` : ''}

${
  book && book.royaltyPending < 1000 && book.royaltyPending > 0
    ? `Since your current accrued balance of ${pending} is below the ₹1,000 threshold, it has automatically rolled over and will be released in the payout cycle immediately after crossing ₹1,000.`
    : `We are cross-verifying this with our accounts ledger against your registered bank details. Our finance team will confirm the transfer status within 48 hours.`
}

If you would like a line-by-line retail platform breakdown (Amazon, Flipkart, BookLeaf Store), please let us know and we will gladly generate that for you.

Warm regards,
BookLeaf Publishing Support Team`;
    }

    case 'ISBN & Metadata Issues': {
      const isbnStr = book?.isbn ? `(ISBN: ${book.isbn})` : '';
      return `Dear ${authorFirstName},

Thank you for bringing this catalog discrepancy to our attention regarding ${bookTitle} ${isbnStr}.

We treat any ISBN or retail metadata inaccuracy as a critical priority. Every BookLeaf title is registered under our official publisher imprint, and catalog integrity across our retail partners is paramount.

We have immediately escalated this ticket to our senior production and cataloging team. We are initiating an urgent metadata validation and feed re-sync with the affected retail channels to ensure the correct ISBN and book details are accurately reflected.

Our production team is actively investigating this and will provide you with a concrete resolution update within 48 hours.

Sincerely,
BookLeaf Publishing Operations Team`;
    }

    case 'Printing & Quality': {
      return `Dear ${authorFirstName},

We sincerely apologise for the quality issues you experienced with your copies of ${bookTitle}. We hold our print standards to high rigor and regret that this shipment did not meet expectations.

BookLeaf guarantees a complimentary free reprint for verified print defects (such as misprints, binding issues, or paper alignment).

To help our Delhi quality assurance team process your replacement swiftly:
1. Please reply to this ticket with clear photographs showing the misaligned pages, binding, or print defects.
2. Confirm the exact count of defective copies received.

As soon as our QA team verifies the images (within 24–48 hours), we will initiate an expedited reprint with a standard turnaround of 5–7 business days dispatched directly to your address at no cost to you.

Warm regards,
BookLeaf Publishing Quality Assurance`;
    }

    case 'Distribution & Availability': {
      const channels = book?.availableOn ? JSON.parse(book.availableOn).join(', ') : 'Amazon, Flipkart, and the BookLeaf Store';
      return `Dear ${authorFirstName},

Thank you for contacting us regarding the distribution availability of ${bookTitle}.

When a live title unexpectedly shows as 'Currently Unavailable' on channels like ${channels}, it is typically caused by a background inventory sync latency between the retail platform's fulfillment centers and our central distribution feed.

We have triggered an immediate distribution re-sync request from our operations desk. Stock status re-synchronizations generally propagate and reflect live on retail platforms within 24 to 48 hours.

Our team will monitor the listing feed closely until active status is confirmed. If the listing does not update within 48 hours, we will manually escalate with the platform vendor team.

Warm regards,
BookLeaf Distribution Desk`;
    }

    case 'Book Status & Production Updates': {
      const currentStatus = book?.status || 'In Production';
      return `Dear ${authorFirstName},

Thank you for checking in on the production progress of ${bookTitle}.

We completely share your enthusiasm to see your book move closer to publication! According to our workflow tracker, your book is currently at the following stage:
→ Current Stage: ${currentStatus}

Our standard production workflow advances through: Manuscript Received → Editing (if opted) → Cover Design → Typesetting → Proofreading → ISBN Assignment → Printing → Distribution Setup → Published & Live.

Delays during typesetting or formatting often occur when our team conducts thorough layout adjustments to guarantee formatting standards before author proofs are generated. We anticipate sharing the next set of proofs/milestone update with you within 3 to 5 business days.

Thank you for your partnership and dedication as we bring your work to life.

Warm regards,
BookLeaf Editorial & Production Team`;
    }

    default: {
      return `Dear ${authorFirstName},

Thank you for contacting BookLeaf Publishing regarding ${bookTitle}.

We have received your query and carefully reviewed your details. Our author support team is dedicated to providing you with clear, transparent assistance.

We are currently looking into your request and will follow up with complete details and next steps within 24 to 48 hours. If you have any additional reference documents or notes to add, please feel free to post them in this thread.

Warm regards,
BookLeaf Publishing Support Team`;
    }
  }
}

/**
 * Cost-conscious token optimization:
 * Only extracts the specific knowledge base policy relevant to the topic
 * rather than loading the entire company handbook into every LLM request.
 */
function getTargetedKBSummary(category?: string): string {
  const base = `BookLeaf Publishing (India & US self-publisher, 1,200+ books/month, Delhi printing plant & warehouse, partners Repro India & Epitome Books).`;
  switch (category) {
    case 'Royalty & Payments':
      return `${base} Royalty Policy: 80/20 net profit split (80% author). Net profit = MRP - (printing + platform fee + shipping). Calculated quarterly, paid within 45 days after quarter end. Minimum payout threshold: ₹1,000 (rolls over if below). Direct bank transfer.`;
    case 'ISBN & Metadata Issues':
      return `${base} ISBN Policy: Assigned by BookLeaf under BookLeaf imprint. Any ISBN discrepancy on retail platforms is Critical priority with strict 48-hour resolution escalation.`;
    case 'Printing & Quality':
      return `${base} Printing & Quality: Standard turnaround 5-7 business days. Quality defects (misprints, binding, color) get free reprint after author submits photos. 48-hr verification.`;
    case 'Distribution & Availability':
      return `${base} Distribution: Channels include Amazon India/US/UK, Flipkart, BookLeaf Store. New listings take 7-10 business days. "Currently Unavailable" indicates stock sync glitch, triggered re-sync resolves in 24-48 hours.`;
    case 'Book Status & Production Updates':
      return `${base} Production Stages: Manuscript Received -> Editing -> Cover Design (author approval) -> Typesetting -> Proofreading -> ISBN Assignment -> Printing -> Distribution Setup -> Published & Live. Delays typically happen at cover design/proofreading rounds.`;
    default:
      return `${base} Comprehensive self-publishing support with 80/20 royalty split, quarterly payouts (min ₹1,000 threshold), in-house Delhi printing (5-7 days), and global retail distribution.`;
  }
}

/**
 * Primary AI Auto-Classification & Priority Scoring
 * Uses Google Gemini API with automatic graceful degradation to contextual heuristics.
 */
export async function classifyAndScoreTicket(
  subject: string,
  description: string,
  author: AuthorContext,
  book?: BookContext | null
): Promise<AIClassificationResult> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    // Graceful degradation when API key is not configured
    return heuristicClassifyAndScore(subject, description);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const prompt = `You are the lead triage AI for BookLeaf Publishing author support.
Analyze the following author support ticket and classify it accurately into exactly ONE category and ONE priority score.

Categories available:
1. Royalty & Payments (payout delays, ledger questions, profit calculations, bank details)
2. ISBN & Metadata Issues (ISBN mismatch on Amazon/retailer, title/author typo, wrong book linked)
3. Printing & Quality (defective author copies, misaligned binding, blurry text, damaged spine)
4. Distribution & Availability (book showing 'Currently Unavailable' on Amazon/Flipkart, stock sync)
5. Book Status & Production Updates (typesetting delay, proofreading round, cover design ETA)
6. General Inquiry (general publishing questions, package info, author bio updates)

Priority levels:
- Critical (Immediate attention: ISBN catalog mismatches, legal threats, severe blocking issues)
- High (Prompt action: long overdue royalties >₹1,000, defective author copies, stalled production)
- Medium (Normal turnaround: inventory sync issues, regular royalty threshold queries, standard status check)
- Low (Low urgency: bio updates, general curiosity, routine questions)

Ticket Subject: "${subject}"
Ticket Description: "${description}"
${book ? `Associated Book: "${book.title}" (Status: ${book.status}, Pending Royalty: ₹${book.royaltyPending})` : 'Associated Book: None (General)'}

Output ONLY valid JSON in this exact structure with no markdown or formatting:
{
  "category": "Royalty & Payments" | "ISBN & Metadata Issues" | "Printing & Quality" | "Distribution & Availability" | "Book Status & Production Updates" | "General Inquiry",
  "priority": "Critical" | "High" | "Medium" | "Low",
  "reasoning": "brief explanation"
}`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    // Clean any markdown code fences if returned
    const cleaned = text.replace(/```json/gi, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    const validCategory = (CATEGORIES as readonly string[]).includes(parsed.category)
      ? (parsed.category as TicketCategoryType)
      : heuristicClassifyAndScore(subject, description).category;

    const validPriority = (PRIORITIES as readonly string[]).includes(parsed.priority)
      ? (parsed.priority as TicketPriorityType)
      : heuristicClassifyAndScore(subject, description).priority;

    return {
      category: validCategory,
      priority: validPriority,
      reasoning: parsed.reasoning || 'Classified via Gemini 1.5 Flash',
    };
  } catch (error) {
    console.warn('⚠️ Gemini AI classification failed or rate-limited; degrading gracefully to rule engine:', error);
    return heuristicClassifyAndScore(subject, description);
  }
}

/**
 * AI-Drafted Response Generation
 * Grounded in BookLeaf Knowledge Base, specific author/book records, and communication tone guidelines.
 */
export async function generateDraftResponse(
  category: TicketCategoryType,
  subject: string,
  description: string,
  author: AuthorContext,
  book?: BookContext | null
): Promise<string> {
  const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;

  if (!apiKey) {
    // Graceful degradation: returns high-quality tailored response based on KB
    return heuristicDraftResponse(category, subject, description, author, book);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

    const kbContext = getTargetedKBSummary(category);

    const prompt = `You are a professional, empathetic author support specialist at BookLeaf Publishing.
Draft an official support response to the author ticket below.

BOOKLEAF COMMUNICATION GUIDELINES:
1. Always empathetic & professional. Authors are creative partners, not customers to manage.
2. Acknowledge and validate the author's concern directly before presenting solutions.
3. Be specific: include actual numbers, dates, statuses, and book titles from the context below.
4. Direct ownership: if an issue is BookLeaf's responsibility (delayed royalties, sync glitch, print defect), acknowledge it immediately with zero corporate deflection.
5. Give definitive timelines (e.g., "Our team will investigate and update you within 48 hours") rather than open-ended promises.
6. Always end with a clear, actionable next step for the author and/or the BookLeaf team.

RELEVANT KNOWLEDGE BASE CONTEXT:
${kbContext}

AUTHOR CONTEXT:
- Name: ${author.name}
- Email: ${author.email}
- Location: ${author.city || 'India'}

${
  book
    ? `BOOK DETAILS:
- Title: ${book.title}
- ISBN: ${book.isbn}
- Genre: ${book.genre}
- Production Status: ${book.status}
- MRP: ₹${book.mrp ?? 'N/A'}
- Author Royalty per Copy: ₹${book.authorRoyaltyPerCopy ?? 'N/A'}
- Total Copies Sold: ${book.totalCopiesSold}
- Total Royalty Earned: ₹${book.totalRoyaltyEarned}
- Royalty Paid to Date: ₹${book.royaltyPaid}
- Royalty Pending: ₹${book.royaltyPending}
- Last Payout Date: ${book.lastRoyaltyPayoutDate ? new Date(book.lastRoyaltyPayoutDate).toISOString().split('T')[0] : 'None (Pending first cycle)'}
- Print Partner: ${book.printPartner || 'In-House (Delhi)'}
- Available Retailers: ${book.availableOn}`
    : 'BOOK DETAILS: General / Account level query (no specific book selected)'
}

AUTHOR TICKET:
- Category: ${category}
- Subject: ${subject}
- Query / Message: "${description}"

Draft the complete response. Start with "Dear ${author.name.split(' ')[0]}," and sign off as "Warm regards,\nBookLeaf Publishing Support Team". Do not include meta tags or placeholders.`;

    const response = await model.generateContent(prompt);
    const text = response.response.text().trim();
    return text || heuristicDraftResponse(category, subject, description, author, book);
  } catch (error) {
    console.warn('⚠️ Gemini AI draft generation failed or rate-limited; degrading gracefully to knowledge base heuristic:', error);
    return heuristicDraftResponse(category, subject, description, author, book);
  }
}
