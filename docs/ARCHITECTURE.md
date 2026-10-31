# BookLeaf Publishing — System Architecture & Design

## 1. High-Level Architecture

The **Author Support & Communication Portal** is architected as a modular, decoupled full-stack application designed for high throughput, sub-second latency, and resilience against external API interruptions.

```
                           +-----------------------------------+
                           |        Client Browser             |
                           |   (React 18 + Vite + Tailwind)    |
                           +-----------------+-----------------+
                                             |
                         REST API (Axios)    |    WebSockets (Socket.io)
                                             |
                                             v
                           +-----------------+-----------------+
                           |        Express.js Server          |
                           |   (Node.js v22+ / TypeScript)     |
                           +--------+-----------------+--------+
                                    |                 |
                    Prisma ORM      |                 | AI Service
                                    v                 v
            +-----------------------+--+    +---------+--------------------+
            |      SQLite Database     |    | Google Gemini 1.5 Flash      |
            |   (dev.db / WAL Mode)    |    |  + Knowledge Base Heuristics |
            +--------------------------+    +------------------------------+
```

---

## 2. Component Breakdown

### A. Author Portal (Author-Facing)
- **Role Isolation**: Authors are restricted exclusively to their own books, royalty figures, and support queries via JWT claims and database-level filters.
- **My Books View**: Displays aggregate royalty figures (Total Copies Sold, Earned, Paid, Pending) alongside status flags for Published & Live vs In-Production stages.
- **Support Query Submissions**: Auto-associates selected books, captures query parameters, and immediately initiates the AI triage pipeline.
- **Real-Time Ticket Thread**: Authors can exchange replies with BookLeaf operations without manual page refreshes.

### B. Admin Portal (Operations-Facing)
- **Ticket Queue Dashboard**: Multi-dimensional filtering across Status, Category, Priority, and Age/Urgency.
- **Oldest Unresolved Sorting**: Visual warning banners and sorting rules surface tickets pending for over 24 hours to prevent backlog accumulation.
- **AI Triage & Overrides**: Displays initial AI classifications and priority scores, with full admin override controls.
- **AI-Drafted Knowledge Grounding**: Formulates pre-drafted responses incorporating BookLeaf company policies (80/20 royalty split, quarterly cycle, 48h resolution SLA) ready for review and editing.
- **Internal Notes**: Allows staff to leave private internal comments (e.g., verifying bank details) without author visibility.

---

## 3. Real-Time WebSocket Event Pipeline

Socket.io is employed to provide responsive updates:

| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join:author` | Client -> Server | `authorId` | Subscribes author to their personal notification room |
| `join:admins` | Client -> Server | — | Subscribes ops personnel to the admin broadcast room |
| `join:ticket` | Client -> Server | `ticketId` | Subscribes client to specific ticket conversation room |
| `ticket:new` | Server -> Admins | Ticket entity | Notifies ops team instantly when a new query is submitted |
| `ticket:update`| Server -> Rooms | Updated ticket | Broadcasts status/category/priority adjustments |
| `ticket:message`| Server -> Rooms | Message entity | Dispatches messages to both author and admin interfaces |

---

## 4. Database Schema (Prisma)

- **User**: Stores authors and admins, password hashes (bcrypt), city, and timestamps.
- **Book**: Captures ISBNs, MRP, royalty rates, sales volumes, payout records, and retail channel availability.
- **Ticket**: Stores query data, AI classification, priority, status, and draft response.
- **TicketMessage**: Maintains message history with an `isInternal` flag to separate author-facing messages from internal notes.
