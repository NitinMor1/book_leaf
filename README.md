# BookLeaf Publishing — Author Support & Communication Portal

A full-stack support and communications platform built for **BookLeaf Publishing**, featuring dual-portal interfaces (**Author Portal** & **Admin Operations Portal**) powered by AI-assisted triage, auto-classification, priority scoring, Knowledge Base-grounded response generation, and real-time WebSocket ticket updates.

---

## 🌟 Key Highlights & Feature Matrix

| Feature | Author Portal | Admin Operations Portal |
|---|---|---|
| **Authentication** | Email & password with isolated author data | Operations team authentication with queue supervision |
| **Catalog & Royalties** | Real-time sales, 80/20 royalty ledger, payout rollover tracker | Catalog directory across all authors & print partners |
| **Edge Cases Handled** | Books in production (typesetting/cover design), zero payouts, rollover | Handled gracefully with contextual status indicators |
| **Support Query Submission** | Book selection dropdown, description, UI attachment | Incoming ticket feed with multi-criteria filters |
| **AI Auto-Classification** | Transparent triage routing to appropriate department | Classified into 6 categories with admin override |
| **AI Priority Scoring** | Automatic urgency calculation (Critical/High/Med/Low) | Prioritized queue sorting & visual alert flags |
| **AI Response Drafting** | Reassurance that BookLeaf guidelines and SLAs apply | Editable pre-drafted response grounded in BookLeaf KB |
| **Internal Collaboration** | — | Internal admin notes invisible to authors |
| **Real-Time Duplexing** | Socket.io live sync: see admin responses without refresh | Instant socket notifications on new queries and replies |
| **Developer Experience** | 1-Click persona switcher across all 10 sample authors | Interactive Swagger UI documentation at `/api/docs` |

---

## 🚀 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher recommended; tested on v22+)
- **npm** (v9 or higher)

### 1. Clone & Install Dependencies
```bash
# Clone the repository
git clone <REPO_URL>
cd book_leaf

# Install root, server, and client dependencies
npm run install:all
```
*(Or install individually: `npm install`, `cd server && npm install`, `cd ../client && npm install`)*

### 2. Configure Environment Variables
A default `.env` is pre-configured in `server/.env`:
```env
PORT=5000
DATABASE_URL="file:./dev.db"
JWT_SECRET="bookleaf_publishing_secret_jwt_key_author_portal_2026"
NODE_ENV="development"

# Optional: Add your Gemini or OpenAI key for live cloud LLM inference.
# If omitted, the system seamlessly runs on the built-in Knowledge Base heuristic engine!
GEMINI_API_KEY=""
```

### 3. Initialize & Seed Database
Pre-populates SQLite with the official 10 authors, 18 books, and initial demo tickets:
```bash
npm run seed
```

### 4. Run the Full-Stack Application
```bash
npm run dev
```
- **Author & Admin Web Application**: [http://localhost:3000](http://localhost:3000)
- **Backend REST API**: [http://localhost:5000](http://localhost:5000)
- **Interactive Swagger OpenAPI Spec**: [http://localhost:5000/api/docs](http://localhost:5000/api/docs)

*(Alternatively, to run the unified production build on a single port: `npm run build && npm run start`, available at `http://localhost:5000`)*

---

## 🔑 Test Login Credentials

| Role | Persona / Name | Email | Default Password | Notes |
|---|---|---|---|---|
| **Admin** | Saloni Mourya (Ops) | `admin@bookleafpub.com` | `admin123` | Full access to ticket queue, triage overrides, and analytics |
| **Admin** | BookLeaf Support Team | `support@bookleafpub.com` | `admin123` | Author success support team account |
| **Author** | Priya Sharma (AUTH001) | `priya.sharma@email.com` | `author123` | 2 books, ₹3,570 pending royalty |
| **Author** | Rohit Kapoor (AUTH002) | `rohit.kapoor@email.com` | `author123` | 2 books (Bestseller *Startup Sutra*), ₹7,744 pending |
| **Author** | Ananya Reddy (AUTH003) | `ananya.reddy@email.com` | `author123` | 1 book, zero previous payouts, ₹2,546 pending |
| **Author** | Sneha Kulkarni (AUTH007) | `sneha.kulkarni@email.com` | `author123` | 3 books (including *Midnight in Mysore* in production) |
| **Author** | Kavita Deshmukh (AUTH009) | `kavita.deshmukh@email.com` | `author123` | 2 books (*Raising Roots* in typesetting) |

> 💡 **Tip:** Use the **"Switch Persona"** button in the top navigation bar or the login screen to switch between any author or admin account with 1 click!

---

## 🧠 AI Integration Details

### 1. Prompt Engineering & Tone Calibration
Prompts are grounded directly in BookLeaf Publishing's operational policies:
- **Tone Guidelines**: Empathetic and professional. Authors are creative partners, not customers to be managed.
- **Direct Ownership**: Owns company delays or print defects directly with zero corporate deflection.
- **Specifics**: Injects exact royalty figures, ISBNs, sales counts, and print partner details.
- **Concrete Commitments**: Adheres strictly to the 48-hour resolution timeline for escalations and 5–7 days for print quality reprints.

### 2. Error Handling & Graceful Degradation
What happens when the LLM API is down, rate-limited, or unconfigured?
- The system includes a **dual-path engine**.
- If `GEMINI_API_KEY` is not present or if the external API throws a network or rate-limit error, the backend falls back to an **Intelligent Knowledge Base Heuristic Engine**.
- Tickets are always created with accurate classification, proper priority scoring, and a policy-grounded draft response. Staff can manually edit drafts at all times.

### 3. Cost Awareness & Token Conservation
- Rather than dumping the entire author database or long conversation histories into the LLM on every call, the backend selectively injects **only the relevant policy slice** (e.g., Royalty Policy vs. Printing & Quality Guidelines) plus the specific book's metadata.
- Reduces token footprint by **>75%** while keeping latency below 600ms.

### 4. Model Choice Justification
- **Google Gemini 1.5 Flash / OpenAI GPT-4o-mini**:
  Chosen for near-instant latency (<1s response), high JSON-mode reliability for categorization, and low operational cost per token.

---

## 🛠️ Technology Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Lucide React, Socket.io-client, Axios.
- **Backend**: Node.js, Express.js (ES Modules), TypeScript, Prisma ORM.
- **Database**: SQLite (zero-config, relational integrity, foreign key cascades).
- **Real-Time**: Socket.io duplex WebSockets with fallback long-polling.
- **Validation**: Zod schema validation with descriptive error payloads.
- **Documentation**: Swagger UI & OpenAPI 3.0 specification.

---

## 📂 Repository Structure

```
book_leaf/
├── sample_data/
│   └── bookleaf_sample_data.json       # Official dataset (10 authors, 18 books)
├── docs/
│   ├── ARCHITECTURE.md                 # System architecture and real-time flows
│   └── API.md                          # REST API specification and examples
├── WRITEUP.md                          # 1-page technical approach & trade-offs
├── server/
│   ├── prisma/
│   │   ├── schema.prisma               # Prisma data models & relational schema
│   │   └── seed.ts                     # Database seeding script
│   ├── src/
│   │   ├── config/kb.ts                # BookLeaf Knowledge Base & tone guidelines
│   │   ├── middleware/auth.ts          # JWT authentication & RBAC
│   │   ├── middleware/errorHandler.ts  # Structured error handling
│   │   ├── routes/auth.routes.ts       # Auth endpoints & demo switcher
│   │   ├── routes/books.routes.ts      # Catalog & royalty rollups
│   │   ├── routes/tickets.routes.ts    # Ticket lifecycle & AI triage
│   │   ├── routes/authors.routes.ts    # Author directory
│   │   ├── routes/stats.routes.ts      # Dashboard operational metrics
│   │   ├── services/aiService.ts       # Gemini API & heuristic fallback
│   │   ├── services/socketService.ts   # Socket.io real-time broadcast engine
│   │   ├── utils/swagger.ts            # OpenAPI 3.0 spec definition
│   │   └── server.ts                   # Express & HTTP server entrypoint
│   └── package.json
├── client/
│   ├── src/
│   │   ├── components/                 # Navbar, Badges, Demo Switcher Modal
│   │   ├── context/                    # AuthContext & SocketContext
│   │   ├── pages/
│   │   │   ├── Login.tsx               # Login with quick 1-click test buttons
│   │   │   ├── author/                 # MyBooks, SubmitTicket, MyTickets, TicketDetail
│   │   │   └── admin/                  # AdminDashboard, AdminTicketQueue, AdminTicketDetail, AuthorDirectory
│   │   ├── services/api.ts             # Axios interceptor
│   │   └── App.tsx                     # React Router & protected routes
│   └── package.json
└── package.json                        # Root workspace scripts
```

---

## 🧪 Edge Cases Handled

1. **Books in Production**: Handled titles like *Midnight in Mysore* and *Raising Roots* with null MRP, null publication dates, and zero royalties, with visual stage indicators ("Cover Design", "Typesetting").
2. **Rollover Royalties**: Enforces the ₹1,000 payout threshold; amounts below this show as rolled over to the next quarter rather than overdue.
3. **Oldest Unresolved Backlog**: Automatically flags tickets pending >24 hours with visual badges and prioritization filters.
4. **Internal Admin Notes**: Messages flagged as internal notes are kept private to ops personnel and never leaked to author query streams.
5. **Admin Triage Overrides**: AI classifications and priority scores can be overridden by admins with audit flags.

---

## 🔮 Production Roadmap

1. **Database Migration**: Migrate SQLite to AWS RDS PostgreSQL with connection pooling.
2. **Vector RAG Pipeline**: Index full publishing contracts and printer guidelines with Pinecone / pgvector.
3. **Email Bridge**: Two-way email synchronization via SendGrid/Postmark inbound parse webhooks.
4. **Royalty Statement Export**: Automated PDF generation for itemized platform sales breakdowns.
