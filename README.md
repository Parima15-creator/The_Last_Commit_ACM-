# JholFree 💸
> **Snap. Speak. Settle. No Jhol. No Confusion.**

A modern, cheerful, and fully functional full-stack web application for splitting restaurant bills fair, transparent, and accurate down to the last paisa.

---

## 🎨 Visual Direction & Design System

- **Typography**:
  - Headings: *DM Serif Display* & *Lora* (Editorial, elegant).
  - Body & Numbers: *Poppins* with clear font weights.
- **Colour Palette**:
  - Warm Yellow: `#FFD83D`
  - Golden Yellow: `#FFC928`
  - Vibrant Orange: `#FF8A1E`
  - Light Cream: `#FFF4D9`
  - Pale Yellow Cards: `#FFFDF0`
  - Soft Teal (Actions): `#009F93`
  - Dark Charcoal: `#292929`
- **UI Elements**:
  - Pill-shaped buttons (`rounded-full`) and soft shadows (`shadow-warm`).
  - Floating coin animations (`₹`) and friendly food illustrations (`🍕`, `🍛`, `☕`).
  - Responsive multi-page layout with desktop sidebar and mobile navigation drawer.
  - Zero graphs: Intuitive dish cards with tap-to-toggle participant pills.

---

## 🚀 Key Modules & Architecture

```text
The_Last_Commit_ACM-/
├── client/ (or src/)
│   ├── components/         # Reusable UI widgets (EmptyState, FloatingCoins, etc.)
│   ├── layouts/            # MainLayout (Sidebar), Navbar
│   ├── pages/
│   │   ├── LandingPage.jsx     # Hero ("Splitting bills? No more Jhol!"), Features, 3 Steps, CTA
│   │   ├── DashboardPage.jsx   # Live stats (Total expenses, owed amounts, recent bills, empty states)
│   │   ├── BillsPage.jsx       # My Bills list, search, filter, inspect receipt, delete
│   │   ├── CreateBillPage.jsx  # Receipt OCR with Groq Vision, Canvas enhancement, manual item editor
│   │   ├── SplitPage.jsx       # Two Modes: Mode 1 (Equal Split) & Mode 2 (Item-Based Split)
│   │   ├── ContactsPage.jsx    # Contact management, phone/UPI validation, past expense history
│   │   ├── PaymentsPage.jsx    # Payment requests, WhatsApp reminders, UPI QR codes, status tracking
│   │   ├── HistoryPage.jsx     # Expense history audit with date & contact filters
│   │   └── SettingsPage.jsx    # User profile, default UPI ID, Groq backend proxy status
│   ├── services/api.js     # Client API connector for /api endpoints
│   ├── context/AppContext  # Global application state
│   ├── utils/              # Image enhancer, currency formatting
│   └── App.jsx             # React Router routing
├── server/
│   ├── config/env.js       # Environment configuration & validation
│   ├── db/store.js         # Persistent JSON file database (CRUD for bills, contacts, payments)
│   ├── controllers/        # Bill, Contact, Payment, AI Groq Proxy, Dashboard controllers
│   ├── routes/             # REST API routes (/api/*)
│   ├── utils/              # Deterministic financial arithmetic (Largest Remainder Method)
│   ├── tests/              # Financial math test suite
│   └── server.js           # Express.js backend server with Groq vision/text proxy
├── .env.example            # Environment variables template
├── .env                    # Protected local environment configuration
└── package.json            # Scripts: dev, server, test, build
```

---

## ⚡ Groq Multimodal Vision & Backend Proxy

- **Security Guarantee**: Your `GROQ_API_KEY` is kept safe on the Express backend server and never leaked into browser bundles.
- **Vision Model**: `qwen/qwen3.8-27b` (Multimodal vision for thermal receipt OCR).
- **Text Model**: `openai/gpt-oss-120b` (Natural language voice-to-split mapping).
- **Offline / Fallback Resilience**: If Groq API is offline or rate-limited, users can seamlessly add or edit line items manually without application crashes.

---

## 🧮 Two Bill-Splitting Modes

1. **Mode 1: Equal Split**:
   - Total bill is divided equally among selected participants down to integer paise using the **Largest Remainder Method (Hamilton-Hare algorithm)**.
   - Sum of individual shares always matches the bill total with **0 paise drift**.

2. **Mode 2: Item-Based Split**:
   - Assign dishes to one or multiple participants with tap-to-toggle pills.
   - Shared dishes are divided equally among assigned consumers.
   - Taxes (CGST, SGST), service charges, discounts, and roundoff are distributed proportionally based on food consumption.

---

## 📦 Running the Application

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment (`.env`)
Copy `.env.example` to `.env`:
```env
PORT=5000
FRONTEND_URL=http://localhost:5173
GROQ_API_KEY=gsk_your_groq_api_key_here
GROQ_VISION_MODEL=qwen/qwen3.8-27b
GROQ_TEXT_MODEL=openai/gpt-oss-120b
```

Phone sign-in sends a standard SMS through the backend. To enable delivery, add a Twilio Account SID, Auth Token, and SMS-capable sender number as `SMS_ACCOUNT_SID`, `SMS_AUTH_TOKEN`, and `SMS_FROM_NUMBER` in `.env`. Users do not need to install a separate app. SMS delivery requires an SMS gateway account and may require enabling delivery to Indian numbers in that account.

### 3. Run Financial Math Unit Tests
```bash
npm test
```

### 4. Start Backend Server
```bash
npm run server
```
Server starts on `http://localhost:5000` with active Groq proxy and persistent storage.

### 5. Start Frontend Development Server
In a separate terminal:
```bash
npm run dev
```
Open `http://localhost:5173` in your browser. (All `/api` calls are automatically proxied to port 5000).

### 6. Build for Production
```bash
npm run build
```
In production, running `node server/server.js` serves both the backend API and the compiled frontend single-page application!
