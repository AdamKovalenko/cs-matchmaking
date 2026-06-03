# Deployment Guide

This app is ready to run as one public web service: the Express backend serves the built React frontend and all API routes under `/api`.

## What You Need

- A MongoDB Atlas database connection string.
- An SMTP provider for real email verification. Gmail App Passwords work for testing; SendGrid, Mailgun, Resend, or Postmark are better for production.
- A hosting provider such as Render, Railway, Fly.io, or a VPS.
- A GitHub repository connected to the hosting provider.

## Required Environment Variables

```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb+srv://...
JWT_SECRET=use-a-long-random-secret
CLIENT_URL=https://your-public-app-url.example

SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-address@gmail.com
SMTP_PASS=your-16-character-app-password
EMAIL_FROM="CS Matchmaking <your-address@gmail.com>"
```

`CLIENT_URL` must be the public URL friends will open. Verification links use this value.

## Render

1. Push this project to GitHub.
2. Create a new Render Web Service from the repository.
3. Use:

```bash
npm run install:all && npm run build
```

as the build command.

4. Use:

```bash
npm start --prefix backend
```

as the start command.

5. Add the environment variables above in Render.

The included `render.yaml` can also be used as a blueprint.

## Local Production Test

```bash
npm run install:all
npm run build
npm start
```

Open `http://127.0.0.1:5000`. In this mode, Express serves the React build.
