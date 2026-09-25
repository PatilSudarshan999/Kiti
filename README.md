# Kiti — AI-Powered Restaurant Operations Manager

> **Kiti** is a production-oriented, real-time restaurant operations management platform that connects the complete restaurant workflow — from table management and order taking to kitchen processing, billing, complaints, and business analytics — through role-specific interfaces and an AI voice assistant.

---

## 📌 Overview

**Kiti** is a full-stack restaurant operations management system designed around a simple principle:

> **Manual actions and AI voice commands must perform the same business operations on the same source of truth.**

The platform provides four specialized operational interfaces:

* **Waiter** → Floor & Order Management
* **Kitchen Chief** → Kitchen Queue & Preparation
* **Manager** → Restaurant Command Center
* **Owner** → Business Analytics & Insights

Each role has its own workflow-optimized interface and permissions.

The system supports two interchangeable interaction modes:

1. **Manual Mode** — users operate the application through the graphical interface.
2. **Voice Mode** — users speak naturally to **Kiti**, which converts the request into a structured function call and executes the same business operation used by the manual interface.

Firestore remains the **single source of truth**. The AI does not store, remember, or independently maintain restaurant data.

---

# 🎯 Project Objectives

Kiti is designed to solve common restaurant operational problems:

* Slow manual order entry
* Poor communication between waiters and kitchen staff
* Lack of real-time order visibility
* Manual table-status tracking
* Difficult order cancellation handling
* Billing and bill-splitting complexity
* Lack of centralized complaint management
* Limited visibility into restaurant performance
* Repetitive dashboard operations
* Operational difficulty when staff have occupied or wet hands

The application focuses on:

* **Correct business workflows**
* **Real-time synchronization**
* **Role-based security**
* **Reliable state transitions**
* **Voice-driven operations**
* **Operational simplicity**
* **Scalable architecture**

---

# 🏗️ System Architecture

```text
                         ┌──────────────────────┐
                         │      Restaurant      │
                         │        Staff         │
                         └──────────┬───────────┘
                                    │
                     ┌──────────────┴──────────────┐
                     │                             │
              Manual Interface                Voice Interface
                     │                             │
                     │                       "Hey Kiti..."
                     │                             │
                     │                    Web Speech Recognition
                     │                             │
                     │                        Transcript
                     │                             │
                     │                         LLM / NLU
                     │                     Function Calling
                     │                             │
                     └──────────────┬──────────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │   Business Actions  │
                         │   / Application API │
                         └──────────┬───────────┘
                                    │
                                    ▼
                         ┌──────────────────────┐
                         │ Firebase Firestore   │
                         │ Single Source Truth  │
                         └──────────┬───────────┘
                                    │
                           Real-Time Listeners
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
                ▼                   ▼                   ▼
             Waiter              Kitchen             Manager
             View                 View                View
                                                       
                                    │
                                    ▼
                                  Owner
                                  View
```

---

# 🛠️ Technology Stack

## Frontend

| Technology               | Purpose                               |
| ------------------------ | ------------------------------------- |
| React                    | Application UI                        |
| Vite                     | Frontend build tooling                |
| React Router             | Role-based routing                    |
| Framer Motion            | UI transitions and micro-interactions |
| Three.js                 | 3D visual elements                    |
| `@react-three/fiber`     | React integration for Three.js        |
| Web Speech API           | Voice recognition                     |
| Web Speech Synthesis API | Voice responses                       |

## Backend / Data

| Technology                    | Purpose                         |
| ----------------------------- | ------------------------------- |
| Firebase Firestore            | Primary database                |
| Firebase Authentication       | User authentication             |
| Firestore Security Rules      | Database-level authorization    |
| Firestore Real-Time Listeners | Live cross-role synchronization |

## AI Layer

The AI layer uses an external LLM provider such as:

* Claude
* Gemini

The LLM is responsible for:

```text
Natural Language
      ↓
Intent Understanding
      ↓
Function Selection
      ↓
Structured Arguments
```

Example:

```text
User:
"Hey Kiti, table 5 — two paneer tikka and one coke"

LLM:
createOrder({
    tableNo: 5,
    items: [
        {
            itemName: "Paneer Tikka",
            quantity: 2
        },
        {
            itemName: "Coke",
            quantity: 1
        }
    ]
})
```

The LLM **does not directly modify Firestore**.

The application validates the requested operation and executes the same business logic used by the manual UI.

---

# 👥 User Roles

Kiti contains four primary roles.

## 1. Waiter — Floor View

### Primary Responsibilities

* View table availability
* Take customer orders
* Add/remove pending items
* Check order status
* Check table status
* Send orders to kitchen
* Initiate billing
* Handle customer-facing operations

### Interface

The Waiter interface is designed around a restaurant floor plan.

Tables display their current status:

| Status      | Meaning                            |
| ----------- | ---------------------------------- |
| 🟢 Free     | Available for a new customer/order |
| 🔴 Occupied | Customer/order currently active    |
| 🟡 Reserved | Reserved for a customer            |
| 🔵 Billing  | Bill is being processed            |

### Voice Examples

```text
"Hey Kiti, table 5 — two paneer tikka, one coke."

"Hey Kiti, is table 3 ready to bill?"

"Hey Kiti, what is the status of table 7?"
```

---

# 👨‍🍳 2. Kitchen Chief — Queue View

### Primary Responsibilities

* View incoming orders
* Track preparation status
* Mark items as preparing
* Mark items as ready
* Check pending workload
* Manage item availability
* Report out-of-stock menu items

### Interface

The kitchen uses a Kanban-style workflow:

```text
┌────────────┐
│  PENDING   │
└─────┬──────┘
      ↓
┌────────────┐
│ PREPARING  │
└─────┬──────┘
      ↓
┌────────────┐
│   READY    │
└────────────┘
```

Orders can also be grouped by:

* Starters
* Main Course
* Drinks
* Desserts

### Voice Examples

```text
"Hey Kiti, how many orders are pending?"

"Hey Kiti, mark table 5's paneer tikka ready."

"Hey Kiti, we're out of paneer tikka."
```

---

# 👨‍💼 3. Manager — Command View

### Primary Responsibilities

* Monitor restaurant operations
* Monitor tables
* Monitor active orders
* Handle operational exceptions
* Review complaints
* Cancel orders where permitted
* Investigate table/order issues

### Interface

The Manager dashboard combines:

```text
┌─────────────────────────────────────┐
│             FLOOR PLAN              │
├──────────────────┬──────────────────┤
│                  │                  │
│   LIVE ORDERS    │    COMPLAINTS    │
│                  │                  │
├──────────────────┴──────────────────┤
│          OPERATIONAL ALERTS          │
└─────────────────────────────────────┘
```

### Voice Examples

```text
"Hey Kiti, what did table 2 order?"

"Hey Kiti, cancel table 7's order."

"Hey Kiti, any complaints today?"
```

---

# 👑 4. Owner — Insights View

### Primary Responsibilities

The Owner interface focuses on business performance rather than day-to-day operational execution.

It provides:

* Sales information
* Revenue metrics
* Customer counts
* Dish popularity
* Complaint summaries
* Business trends

### Voice Examples

```text
"Hey Kiti, what's today's sales?"

"Hey Kiti, what's our most sold dish this week?"

"Hey Kiti, any complaints today?"
```

---

# 🗄️ Firestore Data Model

Kiti uses Firebase Firestore as its primary operational database.

## `tables`

```text
tables/{tableId}
```

```json
{
  "tableNo": 5,
  "status": "Occupied",
  "currentOrderId": "order_123"
}
```

Possible statuses:

```text
Free
Occupied
Reserved
Billing
```

---

## `reservations`

```text
reservations/{reservationId}
```

```json
{
  "tableNo": 5,
  "customerName": "Rahul Patil",
  "phone": "XXXXXXXXXX",
  "reservedTime": "...",
  "partySize": 4,
  "status": "Upcoming"
}
```

Possible statuses:

```text
Upcoming
Seated
No-show
Cancelled
```

---

## `waitlist`

```text
waitlist/{waitlistId}
```

```json
{
  "customerName": "Customer Name",
  "phone": "XXXXXXXXXX",
  "partySize": 3,
  "timeAdded": "...",
  "status": "Waiting"
}
```

Possible statuses:

```text
Waiting
Seated
Left
```

---

## `orders`

```text
orders/{orderId}
```

```json
{
  "tableNo": 5,
  "items": [
    {
      "itemName": "Paneer Tikka",
      "quantity": 2,
      "station": "Starters",
      "status": "Preparing",
      "price": 250
    }
  ],
  "status": "Preparing",
  "timestamp": "...",
  "waiterId": "uid_123",
  "cancellationReason": null
}
```

---

## `menuItems`

```text
menuItems/{menuItemId}
```

```json
{
  "name": "Paneer Tikka",
  "price": 250,
  "category": "Starter",
  "station": "Starters",
  "availability": "InStock"
}
```

Possible availability:

```text
InStock
OutOfStock
```

---

## `staff`

```text
staff/{uid}
```

```json
{
  "name": "Staff Member",
  "role": "Waiter",
  "uid": "firebase-auth-uid"
}
```

Possible roles:

```text
Waiter
KitchenChief
Manager
Owner
```

---

## `bills`

```text
bills/{billId}
```

```json
{
  "orderId": "order_123",
  "items": [],
  "subtotal": 1000,
  "taxPercent": 5,
  "discount": 50,
  "total": 1000,
  "splitType": "Whole",
  "paymentMode": "UPI",
  "status": "Paid"
}
```

Supported split types:

```text
Whole
ByPerson
ByItem
```

Supported payment modes:

```text
Cash
Card
UPI
```

---

## `complaints`

```text
complaints/{complaintId}
```

```json
{
  "tableNo": 5,
  "customerName": "Customer",
  "text": "Food was delayed.",
  "category": "Service",
  "date": "..."
}
```

---

# 🔐 Authentication & Authorization

Firebase Authentication manages user identity.

Each authenticated user has an associated role:

```text
Waiter
KitchenChief
Manager
Owner
```

Example:

```text
Firebase Auth
      ↓
UID
      ↓
staff/{uid}
      ↓
role
      ↓
Application Permissions
```

The role must **not** be trusted only because it exists in frontend state.

Authorization must also be enforced through **Firestore Security Rules**.

---

# 🔒 Role-Based Access Control

The application follows the principle:

> **UI restrictions are for usability; Firestore Security Rules are for security.**

Example permission model:

| Resource         |               Waiter |                  Kitchen |     Manager | Owner |
| ---------------- | -------------------: | -----------------------: | ----------: | ----: |
| Tables           |          Read/Update |                     Read | Read/Update |  Read |
| Orders           |         Own/Relevant |              Read/Update | Read/Update |  Read |
| Menu             |                 Read | Read/Update availability | Read/Update |  Read |
| Bills            |              Limited |                     Read | Read/Manage |  Read |
| Complaints       | Create/Read relevant |                     Read | Read/Manage |  Read |
| Aggregate Sales  |                    ❌ |                        ❌ |     Limited |     ✅ |
| Staff Management |                    ❌ |                        ❌ |     Limited |     ✅ |

The exact rules should be implemented and tested according to the final business requirements.

---

# ⚙️ Core Business Rules

Business rules are enforced at the application/data layer rather than merely represented visually.

## Rule 1 — Pending Item Editing

An order item can be modified or removed only while:

```text
status = Pending
```

Once an item becomes:

```text
Preparing
```

it cannot be silently deleted.

Cancellation requires:

```text
cancellationReason
```

---

## Rule 2 — Out-of-Stock Protection

When a menu item becomes:

```text
OutOfStock
```

the item must immediately become unavailable for new orders.

This applies to:

* Manual ordering
* Voice ordering
* Waiter interface
* Manager interface
* Any other order-creation path

Example:

```text
Menu Item
    ↓
OutOfStock
    ↓
Order Request
    ↓
Validation
    ↓
REJECT
```

---

## Rule 3 — Billing Table Protection

A table with:

```text
status = Billing
```

cannot accept a new order.

The table must first transition back to an available state.

---

## Rule 4 — Bill Splitting

### Whole Bill

```text
Customer → Entire Bill
```

### Split By Person

Example:

```text
Total = ₹1200
People = 4

Each Person = ₹300
```

### Split By Item

Example:

```text
Customer A
- Paneer Tikka

Customer B
- Coke
- Biryani
```

The application calculates the appropriate sub-bills while maintaining the original order/bill relationship.

---

# 🔄 Order Lifecycle

A typical order lifecycle:

```text
Order Created
      ↓
Pending
      ↓
Preparing
      ↓
Ready
      ↓
Served
      ↓
Billing
      ↓
Paid
      ↓
Completed
```

Invalid state transitions must be rejected.

For example:

```text
Ready → Pending
```

should not happen unless explicitly supported by a defined business operation.

---

# 🧠 AI Voice Architecture

Kiti's AI assistant is an **action interpreter**, not a database.

```text
User Speech
     ↓
SpeechRecognition
     ↓
Text
     ↓
LLM
     ↓
Function Call
     ↓
Validation
     ↓
Business Logic
     ↓
Firestore
     ↓
Result
     ↓
SpeechSynthesis
```

Example:

```text
"Hey Kiti, mark table 5's paneer tikka ready."
```

Becomes:

```json
{
  "function": "markItemReady",
  "arguments": {
    "tableNo": 5,
    "itemName": "Paneer Tikka"
  }
}
```

The application then:

1. Validates the user's role.
2. Finds the relevant order.
3. Validates the item's current state.
4. Executes the operation.
5. Updates Firestore.
6. Returns a result.
7. Kiti speaks the response.

---

# 🎙️ Wake Phrase

Voice interaction is initiated through:

```text
"Hey Kiti"
```

Example:

```text
Hey Kiti
      ↓
Listening
      ↓
"Table 5 needs two paneer tikka."
      ↓
Command Processing
```

The interface should clearly indicate:

```text
Idle
Listening
Processing
Speaking
Error
```

---

# 🔄 Manual vs Voice Architecture

A major architectural requirement is that manual and voice actions must not contain duplicated business logic.

### ❌ Incorrect

```text
Manual UI → Firestore

Voice → Separate Firestore logic
```

### ✅ Correct

```text
                    ┌── Manual UI ──┐
                    │              │
                    ▼              │
              Business Actions     │
                    ▲              │
                    │              │
                    └── Voice AI ──┘
                           │
                           ▼
                       Firestore
```

For example:

```text
createOrder()
markItemReady()
cancelOrder()
getTableStatus()
getPendingOrders()
markMenuItemOutOfStock()
getTodaySales()
```

Both interfaces call the same operations.

---

# ⚡ Real-Time Synchronization

Firestore real-time listeners keep role interfaces synchronized.

Example:

```text
Waiter
  │
  │ Creates Order
  ▼
Firestore
  │
  ├──────────────► Kitchen
  │
  ├──────────────► Manager
  │
  └──────────────► Other relevant clients
```

When the Kitchen Chief changes:

```text
Paneer Tikka
Preparing → Ready
```

the Waiter and Manager interfaces should receive the update without requiring a page refresh.

---

# 🎨 UI/UX Design

Kiti uses a shared visual identity while giving each role a fundamentally different working interface.

## Shared Design Language

All interfaces share:

* Kiti assistant orb
* Typography system
* Color system
* Buttons
* Cards
* Status indicators
* Motion language
* Notification patterns
* Voice-state indicators

However, the layouts are role-specific.

---

# 🧊 3D Usage

Three.js should be used selectively.

### Waiter

Primary 3D element:

```text
Restaurant Floor Plan
```

Tables are represented spatially and visually communicate their current state.

### Owner

3D/animated visualization can be used for:

* Revenue trends
* Dish popularity
* Sales metrics

3D must not be used simply for decoration.

The objective is:

> **Visual clarity first, visual novelty second.**

---

# 🎬 Animation System

Framer Motion is used for meaningful interactions.

Examples:

### Kitchen

```text
Pending
   ↓
Preparing
   ↓
Ready
```

Cards physically transition between columns.

### Waiter

Selecting a table:

```text
Floor Plan
    ↓
Camera movement
    ↓
Table-focused Order Panel
```

### Owner

Analytics:

```text
Chart loads
     ↓
Bars animate upward
     ↓
Metric cards count up
```

Animations should remain subtle enough that they do not interfere with operational speed.

---

# 📁 Recommended Project Structure

```text
kiti/
│
├── src/
│   ├── components/
│   │   ├── common/
│   │   ├── voice/
│   │   ├── tables/
│   │   ├── orders/
│   │   ├── kitchen/
│   │   ├── billing/
│   │   └── analytics/
│   │
│   ├── pages/
│   │   ├── auth/
│   │   ├── waiter/
│   │   ├── kitchen/
│   │   ├── manager/
│   │   └── owner/
│   │
│   ├── services/
│   │   ├── firebase/
│   │   ├── orders/
│   │   ├── tables/
│   │   ├── billing/
│   │   ├── complaints/
│   │   └── voice/
│   │
│   ├── hooks/
│   ├── contexts/
│   ├── utils/
│   ├── types/
│   ├── routes/
│   ├── App.jsx
│   └── main.jsx
│
├── public/
│
├── firestore.rules
├── firestore.indexes.json
├── firebase.json
├── .env
├── .env.example
├── package.json
└── README.md
```

---

# 🚀 Development Roadmap

Development should be performed incrementally.

## Phase 1 — Firebase Foundation

### Deliverables

* Firebase project
* Firebase Authentication
* Firestore database
* Collection structure
* Staff role model
* Security Rules
* Required Firestore indexes

### Validation

Verify:

* Users can authenticate.
* Roles are correctly associated.
* Unauthorized users cannot access restricted data.
* Security rules reject invalid operations.

---

# Phase 2 — Role-Based Manual UI

Build all four interfaces without voice.

```text
Waiter
Kitchen
Manager
Owner
```

Use placeholder/mock data initially.

The objective is to validate:

* Navigation
* Layout
* Role separation
* Core workflows
* Component architecture

---

# Phase 3 — Firestore Integration

Replace placeholder data with real Firestore operations.

Implement:

* Real-time table status
* Order creation
* Order updates
* Kitchen status updates
* Menu availability
* Billing
* Complaints
* Reservations
* Waitlist

---

# Phase 4 — Waiter Voice

Implement:

```text
"Hey Kiti"
```

Supported operations:

```text
createOrder()
getTableStatus()
```

Example:

```text
"Hey Kiti, table 5 needs two paneer tikka."
```

---

# Phase 5 — Kitchen Voice

Implement:

```text
getPendingOrders()
markItemReady()
markMenuItemOutOfStock()
```

Example:

```text
"Hey Kiti, how many orders are pending?"
```

---

# Phase 6 — Owner Voice

Implement:

```text
getTodaySales()
getTopDish()
getComplaintSummary()
```

Example:

```text
"Hey Kiti, what's today's sales?"
```

---

# Phase 7 — Manager Voice

Implement:

```text
getOrderDetails()
cancelOrder()
getComplaintSummary()
```

Manager voice is implemented after the higher-priority operational voice workflows.

---

# Phase 8 — Visual Polish

Only after the core workflows are stable:

* 3D restaurant floor plan
* Animated analytics
* Framer Motion transitions
* Advanced voice states
* Kiti assistant orb
* Micro-interactions
* Loading/error animations

---

# 🧪 Testing Strategy

Kiti should be tested at multiple levels.

## Business Logic Tests

Examples:

```text
Can a Preparing item be silently deleted?
→ No

Can an OutOfStock item be ordered?
→ No

Can a Billing table receive a new order?
→ No

Can a Waiter access another Waiter's financial totals?
→ No
```

---

## Role Tests

Test each role independently:

```text
Waiter
Kitchen Chief
Manager
Owner
```

Verify both:

* Allowed operations
* Forbidden operations

---

## Real-Time Tests

Example:

```text
Client A: Waiter
Client B: Kitchen

Waiter creates order
        ↓
Kitchen receives order immediately

Kitchen marks item Ready
        ↓
Waiter receives update immediately
```

---

# 🛡️ Security Requirements

Security is enforced at multiple levels.

### Authentication

Firebase Authentication verifies identity.

### Authorization

Firestore Security Rules verify role permissions.

### Application Validation

Business logic validates:

* User permissions
* Current state
* Input validity
* Menu availability
* Order ownership/access
* Valid state transitions

### AI Safety

AI-generated function calls must never bypass authorization.

For example:

```text
Voice:
"Hey Kiti, show me today's total sales."

```

If the authenticated user is a Waiter:

```text
AI Function Call
      ↓
Authorization Check
      ↓
REJECT
```

The LLM must not be treated as a trusted administrator.

---

# 🔑 Environment Variables

Sensitive configuration must not be hardcoded.

Example:

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=

VITE_AI_PROVIDER=
VITE_AI_API_URL=
```

Use:

```text
.env
```

for local development and:

```text
.env.example
```

for documentation.

Never commit production secrets.

---

# ▶️ Local Development

## 1. Clone Repository

```bash
git clone <repository-url>
cd kiti
```

## 2. Install Dependencies

```bash
npm install
```

## 3. Configure Environment

Create:

```text
.env
```

and provide the required Firebase and AI configuration.

## 4. Start Development Server

```bash
npm run dev
```

The Vite development server will provide the local application URL.

---

# 📦 Production Build

Create a production build:

```bash
npm run build
```

Preview the production build locally:

```bash
npm run preview
```

Before deployment, verify:

* Authentication
* Firestore Rules
* Real-time listeners
* Voice permissions
* AI function calling
* Billing calculations
* Role authorization
* Error handling

---

# 📊 Operational State Model

Kiti should treat restaurant operations as state machines rather than arbitrary database updates.

Example:

```text
TABLE

Free
 │
 ▼
Occupied
 │
 ▼
Billing
 │
 ▼
Free
```

Order:

```text
Pending
   ↓
Preparing
   ↓
Ready
   ↓
Served
   ↓
Billing
   ↓
Completed
```

The application must reject unsupported transitions.

---

# ❌ Error Handling

The application must provide meaningful responses for cases such as:

```text
Table does not exist
Table is currently billing
Menu item does not exist
Menu item is out of stock
Order does not exist
Item is already ready
Item cannot be cancelled
User lacks permission
Invalid bill split
Invalid payment state
Voice command could not be understood
AI function call failed
Firestore request failed
```

Example voice response:

```text
"Paneer Tikka is currently out of stock, so I couldn't add it to table 5's order."
```

Instead of:

```text
"Error."
```

---

# 🧠 AI Design Principles

Kiti follows these principles:

### 1. AI is not the database

Firestore stores the business state.

### 2. AI is not the authorization layer

Firebase Security Rules and application authorization determine what a user can do.

### 3. AI is not business logic

The AI identifies the requested operation.

The application validates and executes it.

### 4. Voice and UI must remain consistent

A command performed through voice must produce the same result as the corresponding manual action.

### 5. AI failures must not corrupt data

If the LLM produces an invalid function call:

```text
Invalid Function
      ↓
Validation
      ↓
Rejected
```

No invalid Firestore mutation should occur.

---

# 📈 Future Expansion

The architecture should allow future features such as:

* Inventory management
* Supplier management
* Purchase orders
* Employee attendance
* Payroll integration
* Customer loyalty
* Online ordering
* QR-code ordering
* Kitchen display system
* Multi-branch restaurant support
* Advanced sales analytics
* Demand forecasting
* AI-powered inventory predictions
* Automated daily business reports

These features should be added without compromising the existing role and security model.

---

# 🏁 Definition of Done

Kiti should be considered production-ready only when:

* [ ] Firebase Authentication works
* [ ] All four roles are implemented
* [ ] Firestore schema is finalized
* [ ] Firestore Security Rules are tested
* [ ] Role-based permissions work
* [ ] Tables update in real time
* [ ] Orders follow valid state transitions
* [ ] Kitchen queue works
* [ ] Out-of-stock protection works
* [ ] Billing works
* [ ] Bill splitting works
* [ ] Complaints work
* [ ] Manual workflows are complete
* [ ] Waiter voice commands work
* [ ] Kitchen voice commands work
* [ ] Owner voice commands work
* [ ] Manager voice commands work
* [ ] AI function calling is validated
* [ ] Voice and manual actions share business logic
* [ ] Error handling is implemented
* [ ] Real-time synchronization is verified
* [ ] 3D floor plan is implemented
* [ ] Analytics animations are implemented
* [ ] Production build succeeds
* [ ] Security rules are tested against unauthorized access

---

# 📋 Development Philosophy

Kiti should be developed in the following order:

```text
CORRECTNESS
    ↓
SECURITY
    ↓
BUSINESS LOGIC
    ↓
REAL-TIME DATA
    ↓
VOICE AI
    ↓
USER EXPERIENCE
    ↓
3D / ANIMATION POLISH
```

The project should **not** prioritize visual effects over operational correctness.

A simple interface with correct business workflows is more valuable than a visually impressive interface that allows invalid restaurant operations.

---

# 👨‍💻 Project Status

**Project:** Kiti
**Type:** AI-Powered Restaurant Operations Management System
**Architecture:** React + Firebase + AI Function Calling
**Database:** Firebase Firestore
**Authentication:** Firebase Authentication
**Interaction Modes:** Manual + Voice
**Primary AI Interface:** "Hey Kiti"
**Application Model:** Real-Time, Role-Based, Multi-User

---

## Core Principle

> **Kiti does not replace the restaurant's operational system with AI. It adds an intelligent voice interface on top of a reliable, role-secured operational system.**

The database remains the source of truth, business rules remain deterministic, and AI acts as the natural-language interface through which authorized users can operate the same system.
