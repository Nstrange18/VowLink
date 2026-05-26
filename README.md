# 💍 Vowlink — Wedding Invitation Portal

> A beautiful, full-stack wedding invitation management platform. Couples create personalised digital invitations, guests RSVP with meal preferences, and everything is managed through a sleek dark-themed admin dashboard.

![Vowlink](https://img.shields.io/badge/Vowlink-Wedding%20Portal-D8B76A?style=for-the-badge)
![React](https://img.shields.io/badge/React-18-61DAFB?style=flat-square&logo=react)
![Node.js](https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js)
![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?style=flat-square&logo=mongodb)

---

## ✨ Features

### For Couples (Admin)
- 🔐 **Secure Auth** — JWT access + refresh tokens with silent refresh, show/hide password
- 🔑 **Forgot Password** — Reset via email link (or server console in dev)
- 📋 **Dashboard** — Stats overview + guest breakdown by category (VIP, Family, Friend, Guest…)
- 💌 **Invitations** — Create, edit, delete personalised invitations with custom greetings
- 📲 **WhatsApp Share** — One-click per-invitation sharing
- 🗂 **RSVP Management** — View all responses with meal preferences
- 📊 **CSV Export** — Download full guest list with one click
- ⚙️ **Settings** — Update couple names, wedding date, venue & RSVP deadline

### For Guests
- 🎨 **Beautiful Invite Cards** — Light-themed floral design with couple names, date, venue & category badge
- ⏱ **Live Countdown** — Real-time DD:HH:MM:SS countdown to the wedding day
- 🔒 **RSVP Deadline** — Auto-locks RSVP form when deadline passes
- 🍽 **Meal Preferences** — Choose from Chicken, Fish, Vegetarian, Vegan, or No Preference
- ⬇️ **Downloadable** — Save invitation card as a crisp 2× PNG image
- 📲 **WhatsApp Share** — Guests can forward their invite directly

---

## 🗂 Project Structure

```
VowLink/
├── client/          # React + Vite frontend
│   ├── src/
│   │   ├── components/   # AdminLayout, CustomSelect, ProtectedRoute
│   │   ├── pages/
│   │   │   ├── admin/    # Dashboard, Invitations, RSVPs, Settings, Auth pages
│   │   │   ├── InvitePage.jsx
│   │   │   └── RsvpSuccessPage.jsx
│   │   ├── utils/        # Axios instance with auth interceptors
│   │   └── App.jsx
│   └── public/           # Static assets (logo, hero background)
│
├── server/          # Node.js + Express backend
│   ├── models/
│   │   ├── User.js       # Couple accounts (names, date, venue, deadline)
│   │   ├── Invitation.js # Guest invitations with slug
│   │   └── RSVP.js       # Guest responses with meal preference
│   ├── routes/
│   │   ├── authRoutes.js       # Signup, login, refresh, forgot/reset password
│   │   ├── invitationRoutes.js
│   │   └── rsvpRoutes.js
│   ├── middleware/
│   │   └── auth.js       # JWT protect middleware
│   └── server.js
│
├── vercel.json      # Vercel SPA routing config (frontend)
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js ≥ 18
- MongoDB Atlas account (or local MongoDB)

### 1. Clone the repo
```bash
git clone https://github.com/Nstrange18/VowLink.git
cd VowLink
```

### 2. Set up the server
```bash
cd server
npm install
```

Create `server/.env`:
```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
CLIENT_URL=http://localhost:5173

# Optional — enables actual password reset emails
EMAIL_USER=your-gmail@gmail.com
EMAIL_PASS=your-gmail-app-password
```

> **Gmail App Password**: Go to Google Account → Security → 2-Step Verification → App Passwords

```bash
npm run dev   # starts on port 5000
```

### 3. Set up the client
```bash
cd client
npm install
```

Create `client/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

```bash
npm run dev   # starts on port 5173
```

---

## 🌐 Deployment

### Frontend → Vercel
1. Import the repo in [Vercel](https://vercel.com)
2. Set **Root Directory** to `client` (or leave root — `vercel.json` handles it)
3. Add environment variable: `VITE_API_URL=https://your-server-url.com/api`
4. Deploy — SPA routing is handled by `vercel.json`

### Backend → Railway / Render
1. Create a new project and connect this repo
2. Set **Root Directory** to `server`
3. Set **Start Command** to `npm start`
4. Add all environment variables from `server/.env`
5. Copy the deployed URL and update `VITE_API_URL` in your Vercel project

---

## 🔑 Environment Variables

| Variable | Location | Description |
|---|---|---|
| `MONGO_URI` | server | MongoDB connection string |
| `JWT_SECRET` | server | Access token secret |
| `JWT_REFRESH_SECRET` | server | Refresh token secret |
| `CLIENT_URL` | server | Frontend URL (for password reset links) |
| `EMAIL_USER` | server | Gmail address (optional, for reset emails) |
| `EMAIL_PASS` | server | Gmail app password (optional) |
| `VITE_API_URL` | client | Backend API base URL |

---

## 🛠 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, React Router, TailwindCSS |
| Backend | Node.js, Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh tokens), bcryptjs |
| Email | Nodemailer (Gmail SMTP) |
| Image Export | html-to-image |

---

## 📸 Screenshots

> *Admin Dashboard — dark themed with stats and category breakdown*

> *Guest Invite Card — light floral design with countdown timer and download button*

---

## 📄 License

MIT © [Nstrange18](https://github.com/Nstrange18)
