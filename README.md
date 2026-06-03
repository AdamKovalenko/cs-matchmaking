# CS Matchmaking Platform

Full-stack Counter-Strike scheduling app with React, Tailwind CSS, Express, MongoDB/Mongoose, JWT auth, bcrypt password hashing, and Nodemailer transactional email hooks.

## Features

- Register with username, email, and password.
- Send email verification/welcome email after registration.
- Login with username or email.
- Forgot-password and reset-password token flow.
- Authenticated users can create dated CS sessions.
- Users can view upcoming sessions and join sessions.
- Joined users can leave sessions.
- Hosts can cancel their sessions.
- Session cards show host and joined players.

## Setup

1. Start MongoDB locally or provide a hosted MongoDB connection string.
2. Copy `backend/.env.example` to `backend/.env` and update values.
3. Copy `frontend/.env.example` to `frontend/.env` if your API URL differs.
4. Install dependencies:

```bash
npm run install:all
```

5. Run both apps in separate terminals:

```bash
cd backend
npm run dev
```

```bash
cd frontend
npm run dev
```

Frontend runs at `http://localhost:5173`; backend runs at `http://localhost:5000`.

The frontend calls `/api` by default. During local Vite development, requests are proxied to `http://127.0.0.1:5000`.

## Local Demo Mode

If MongoDB is not installed locally, run the in-memory demo API:

```bash
cd backend
npm run demo
```

Demo registrations return a verification link in the UI message when SMTP is not configured. If SMTP variables exist in `backend/.env`, demo mode sends real email through Nodemailer.

## Sending Real Email

Create `backend/.env` from `backend/.env.example` and fill in a real SMTP provider. For Gmail, use an App Password, not your normal account password:

```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/cs_matchmaking
JWT_SECRET=replace-with-a-long-random-secret
CLIENT_URL=http://127.0.0.1:5173

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM="CS Matchmaking <your-address@gmail.com>"
```

After changing `.env`, restart the backend.

## Sharing With Friends

Friends cannot use `127.0.0.1` on your computer. To share this app for real, deploy it to a public URL and set `CLIENT_URL` to that public URL. See `DEPLOYMENT.md`.

## API

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/verify-email/:token`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password/:token`

### Sessions

- `GET /api/sessions`
- `POST /api/sessions`
- `POST /api/sessions/:id/join`
- `POST /api/sessions/:id/leave`
- `DELETE /api/sessions/:id`
