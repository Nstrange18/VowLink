# VowLink

VowLink is a full-stack wedding invitation platform for couples, guests, and venues. Couples can create digital invitations, manage RSVPs, customize public invite themes, send bulk WhatsApp invitations, collect gift contributions, and manage wedding details from an admin dashboard.

## Features

- Couple/admin authentication with JWT access and refresh tokens
- Wedding dashboard with countdown, guest stats, RSVP stats, and seating tools
- Invitation creation, editing, deletion, and public invite pages
- RSVP collection with meal preferences, plus-one policy, kids policy, and deadlines
- Bulk invitation import and WhatsApp bulk sending queue
- Theme and template customization, including uploaded and AI-generated backgrounds
- Default guest invite theme setting: dark, light, or system
- Public invite light/dark toggle with per-invite guest preference storage
- Music, gallery, slideshow, gift registry, wish wall, and share preview sections
- Venue owner portal with venue listings, photos, subscriptions, and inquiries
- Paystack integration for upgrades and guest gifts
- Cloudinary uploads for media and generated images
- OpenAI-powered message/background generation with plan-based credits

## Tech Stack

| Layer | Technology |
| --- | --- |
| Client | React 19, Vite 7, React Router, Tailwind CSS, React Hook Form, Zod |
| Server | Node.js, Express 5, Mongoose |
| Database | MongoDB |
| Auth | JWT, bcryptjs |
| Media | Cloudinary |
| Email | SendGrid |
| Payments | Paystack |
| AI | OpenAI |

## Project Structure

```text
VowLink/
  client/                 React/Vite frontend
    api/                  Vercel/serverless helper endpoint
    public/               Static public assets and templates
    src/
      components/         Shared UI and feature components
      context/            Settings provider and shared state
      pages/              Public, admin, and venue pages
      utils/              API client, schemas, template layout helpers
  server/                 Express backend
    middleware/           Auth middleware
    models/               Mongoose models
    routes/               Auth, invitations, RSVPs, venues, AI routes
    utils/                Email and credit helpers
  vercel.json             Root deployment/routing config
  README.md
```

## Requirements

- Node.js 18 or newer
- MongoDB database
- Cloudinary account for uploads
- SendGrid API key for email delivery
- Paystack keys for payments
- OpenAI API key for AI features

## Environment Variables

Create `server/.env`:

```env
PORT=5000
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
CLIENT_URL=http://localhost:5173

SENDGRID_API_KEY=your_sendgrid_api_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_api_key
CLOUDINARY_API_SECRET=your_cloudinary_api_secret

PAYSTACK_SECRET_KEY=your_paystack_secret_key
OPENAI_API_KEY=your_openai_api_key
# Optional alternative used by the AI route:
AI_API_SECRET_KEY=your_openai_api_key
```

Create `client/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_PAYSTACK_PUBLIC_KEY=your_paystack_public_key
```

## Local Development

Install and run the backend:

```bash
cd server
npm install
npm run dev
```

Install and run the frontend in a second terminal:

```bash
cd client
npm install
npm run dev
```

Default local URLs:

- Client: `http://localhost:5173`
- Server: `http://localhost:5000`
- API base: `http://localhost:5000/api`

## Scripts

Client:

```bash
cd client
npm run dev
npm run build
npm run lint
npm run preview
```

Server:

```bash
cd server
npm run dev
npm start
```

## Deployment

Frontend is designed for Vercel. Set the client environment variables in Vercel and deploy the `client` app or use the repo deployment setup.

Backend can be deployed to Render, Railway, or another Node host. Set all server environment variables and use:

```bash
npm start
```

After deploying the server, update the frontend `VITE_API_URL` to point to the deployed API URL.

## Notes

- Do not commit `.env` files or secrets.
- Anything placed in `client/public` is shipped publicly.
- Public invite guest theme preferences are stored per invite in localStorage.
- Run `npm run lint` and `npm run build` in `client` before shipping frontend changes.
