# BookLeaf Publishing — API Documentation

Interactive Swagger OpenAPI UI is hosted at: `http://localhost:5000/api/docs`

---

## Base URL
- Local: `http://localhost:5000/api`

---

## Authentication & Headers
All endpoints (except `/api/auth/login`, `/api/auth/demo-accounts`, and `/api/health`) require a JWT Bearer token:
```http
Authorization: Bearer <JWT_TOKEN>
```

---

## 1. Authentication Endpoints

### `POST /api/auth/login`
Authenticate as an Author or BookLeaf Admin.

**Request Body:**
```json
{
  "email": "priya.sharma@email.com",
  "password": "author123"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "cm3xxx",
    "authorId": "AUTH001",
    "name": "Priya Sharma",
    "email": "priya.sharma@email.com",
    "role": "AUTHOR",
    "phone": "+91-98765-43210",
    "city": "Mumbai"
  }
}
```

### `GET /api/auth/me`
Retrieve profile of currently authenticated user.

### `GET /api/auth/demo-accounts`
Returns the list of 10 pre-seeded sample authors and administrative credentials.

---

## 2. Books & Catalog Endpoints

### `GET /api/books`
- **For Authors**: Returns only books belonging to the authenticated author, along with summary royalty rollups.
- **For Admins**: Returns all catalog titles or filtered by `?authorId=...`.

**Response (200 OK):**
```json
{
  "success": true,
  "summary": {
    "totalBooks": 2,
    "totalCopiesSold": 531,
    "totalRoyaltyEarned": 19908,
    "totalRoyaltyPaid": 16338,
    "totalRoyaltyPending": 3570
  },
  "books": [
    {
      "id": "BK001",
      "title": "Whispers of the Ganges",
      "isbn": "978-93-5XXXX-01-1",
      "genre": "Literary Fiction",
      "status": "Published & Live",
      "mrp": 399,
      "authorRoyaltyPerCopy": 35,
      "totalCopiesSold": 342,
      "totalRoyaltyEarned": 11970,
      "royaltyPaid": 8400,
      "royaltyPending": 3570,
      "printPartner": "In-House",
      "availableOn": ["Amazon India", "Flipkart", "BookLeaf Store"]
    }
  ]
}
```

---

## 3. Tickets & Support Endpoints

### `GET /api/tickets`
Query params:
- `status`: `Open` | `In Progress` | `Resolved` | `Closed`
- `category`: `Royalty & Payments` | `ISBN & Metadata Issues` | `Printing & Quality` | `Distribution & Availability` | `Book Status & Production Updates` | `General Inquiry`
- `priority`: `Critical` | `High` | `Medium` | `Low`
- `sortBy`: `oldest_unresolved` | `priority` | `newest` | `oldest`
- `search`: free-text search across author name, email, book, subject

### `POST /api/tickets`
Submit a support query. Automatically invokes AI classification, priority scoring, and Knowledge Base-grounded response drafting.

**Request Body:**
```json
{
  "bookId": "BK001",
  "subject": "Pending royalty payout question for Q3",
  "description": "I see a pending royalty of ₹3,570 for Whispers of the Ganges. Could you confirm the payout schedule?",
  "attachmentName": "screenshot_dashboard.png"
}
```

### `GET /api/tickets/:id`
Retrieves ticket detail with complete message thread.
- Authors only see public messages.
- Admins see both public messages and internal notes.

### `PATCH /api/tickets/:id` (Admin Only)
Update ticket status, override AI category, override AI priority, or assign staff.

**Request Body:**
```json
{
  "status": "In Progress",
  "category": "Royalty & Payments",
  "priority": "High",
  "assignedToId": "cm3xxx"
}
```

### `POST /api/tickets/:id/messages`
Add a message or internal note.
- `message`: Text content.
- `isInternal`: `true` to store an internal note hidden from the author (Admin only).
- `updateStatus`: Optionally transition ticket status upon sending.

---

## 4. Analytics & Authors

### `GET /api/stats/dashboard` (Admin Only)
Returns aggregate metrics (open, critical, backlog >24h, category counts).

### `GET /api/authors` (Admin Only)
Lists all registered authors and their performance metrics.
