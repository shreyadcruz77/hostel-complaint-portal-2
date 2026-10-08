# 🏢 Hostel Complaint Portal

A minimal, full-stack workshop web application designed for hostel residents to lodge maintenance complaints, track resolution status, and securely authenticate using **One-Time Passwords (OTP) via the Minimoth API** (WhatsApp & SMS delivery).

Built as a lightweight 45-minute workshop project adhering to strict architectural limits: **maximum 3 frontend pages, 5 backend API endpoints, and 3 database models**.

---

## 🚀 Tech Stack

- **Frontend:** React (Vite), Vanilla CSS (Responsive Design System)
- **Backend:** Node.js, Express
- **Database:** SQLite (via native `node:sqlite`)
- **Authentication:** WhatsApp / SMS OTP via [Minimoth API](https://minimoth.dev)

---

## 📐 Project Architecture

### 1. Database Models (3 Entities)

1. **`users`**
   - `id` (TEXT, Primary Key)
   - `phone` (TEXT, Unique)
   - `name` (TEXT)
   - `room_number` (TEXT)
   - `created_at` (DATETIME)

2. **`categories`**
   - `id` (TEXT, Primary Key)
   - `name` (TEXT, Unique - e.g., *Electrical, Plumbing & Water, Wi-Fi & Internet, Furniture & Carpentry, Housekeeping*)
   - `icon` (TEXT)

3. **`complaints`**
   - `id` (TEXT, Primary Key)
   - `user_id` (TEXT, Foreign Key -> `users.id`)
   - `category` (TEXT)
   - `title` (TEXT)
   - `description` (TEXT)
   - `room_number` (TEXT)
   - `status` (TEXT - `'Pending' | 'In Progress' | 'Resolved'`)
   - `created_at` (DATETIME)

---

### 2. Backend API Endpoints (5 Endpoints)

| # | Method | Endpoint | Description |
|---|--------|----------|-------------|
| 1 | `POST` | `/api/auth/send-otp` | Sends WhatsApp/SMS OTP via Minimoth API |
| 2 | `POST` | `/api/auth/verify-otp` | Verifies OTP code; logs in existing user or registers new user |
| 3 | `GET` | `/api/complaints` | Retrieves complaints (supports `?userId=` filter) |
| 4 | `POST` | `/api/complaints` | Lodges a new maintenance complaint |
| 5 | `PATCH` | `/api/complaints/:id/status` | Updates complaint status (`Pending` -> `In Progress` -> `Resolved`) |

---

### 3. Frontend Pages (3 Pages)

1. **`AuthPage` (`pages/AuthPage.jsx`):**
   - Resident Login and New Resident Registration
   - Phone number input with WhatsApp/SMS OTP dispatch via Minimoth
   - 6-digit verification code with resend countdown timer

2. **`ComplaintsPage` (`pages/ComplaintsPage.jsx`):**
   - Feed of filed complaints with category icons and room details
   - Status filters: *All*, *Pending*, *In Progress*, *Resolved*
   - Interactive status dropdown to update complaint progress

3. **`NewComplaintPage` (`pages/NewComplaintPage.jsx`):**
   - Maintenance category tile selector (⚡ Electrical, 🚰 Plumbing, 📶 Wi-Fi, 🪑 Furniture, 🧹 Cleaning)
   - Room number, issue title, and detailed description form

---

## ⚙️ Setup & Running Instructions

### Prerequisites
- Node.js (v20+ or v24+ recommended)
- Minimoth API key from [minimoth.dev](https://minimoth.dev) *(Optional for demo testing)*

---

### Step 1: Backend Setup

```bash
cd backend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

Open `backend/.env` and insert your Minimoth API key:
```env
PORT=5000
MINIMOTH_API_KEY=your_minimoth_api_key_here
```

> **💡 Demo Mode Note:** If `MINIMOTH_API_KEY` is not provided or set to the placeholder, the backend automatically runs in **Demo Mode**. You can enter phone number and use code `123456` to log in instantly!

Start the backend server:
```bash
npm run dev
# or: node server.js
```
The backend starts at `http://localhost:5000`.

---

### Step 2: Frontend Setup

Open a new terminal window:
```bash
cd frontend

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env
```

`frontend/.env` content:
```env
VITE_API_BASE_URL=http://localhost:5000/api
```

Start the frontend development server:
```bash
npm run dev
```

Open your browser at `http://localhost:5173`.

---

## 🔒 Minimoth OTP Integration Flow

1. **User enters mobile number** (e.g. `9876543210` or `+919876543210`).
2. **Backend calls Minimoth API:**
   - `POST https://api.minimoth.dev/v1/otp/send`
   - Header: `X-Api-Key: <MINIMOTH_API_KEY>`
   - Minimoth delivers 6-digit OTP directly via WhatsApp (with automatic SMS fallback).
3. **User submits OTP code:**
   - `POST https://api.minimoth.dev/v1/otp/verify`
   - Upon verification, the resident session is initialized in SQLite.

---

## 📂 Directory Structure

```
hostel-complaint-portal/
├── backend/
│   ├── .env
│   ├── .env.example
│   ├── database.js      # SQLite schema (User, Category, Complaint)
│   ├── package.json
│   └── server.js        # 5 REST API endpoints + Minimoth integration
├── frontend/
│   ├── .env
│   ├── .env.example
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js
│   └── src/
│       ├── main.jsx
│       ├── App.jsx      # Navigation & session controller
│       ├── index.css    # Clean responsive design system
│       └── pages/
│           ├── AuthPage.jsx         # Page 1: Login & Register with OTP
│           ├── ComplaintsPage.jsx   # Page 2: Complaint list & status update
│           └── NewComplaintPage.jsx # Page 3: Lodge complaint form
└── README.md
```
