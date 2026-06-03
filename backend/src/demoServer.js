import crypto from "crypto";
import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { sendEmail, verificationEmail, passwordResetEmail } from "./utils/email.js";
import { signToken } from "./utils/token.js";

dotenv.config();

process.env.JWT_SECRET ||= "local-demo-secret-change-me";
process.env.CLIENT_URL ||= "http://127.0.0.1:5173";

const app = express();
const PORT = process.env.PORT || 5000;
const users = [];
const sessions = [];

app.use(cors({ origin: ["http://localhost:5173", "http://127.0.0.1:5173"] }));
app.use(express.json());

function publicUser(user) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    isEmailVerified: user.isEmailVerified
  };
}

function auth(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = users.find((candidate) => candidate.id === payload.userId);

    if (!user) {
      return res.status(401).json({ message: "User no longer exists" });
    }

    if (!user.isEmailVerified) {
      return res.status(403).json({ message: "Please verify your email before using this feature" });
    }

    req.user = publicUser(user);
    next();
  } catch (_error) {
    res.status(401).json({ message: "Invalid or expired token" });
  }
}

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", mode: "demo-memory" });
});

app.post("/api/auth/register", async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "Username, email, and password are required" });
  }

  if (password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const normalizedEmail = email.toLowerCase();
  const existingUser = users.find((user) => user.username === username || user.email === normalizedEmail);

  if (existingUser) {
    return res.status(409).json({ message: "Username or email already exists" });
  }

  const user = {
    id: crypto.randomUUID(),
    username,
    email: normalizedEmail,
    password: await bcrypt.hash(password, 12),
    isEmailVerified: false,
    emailVerificationToken: crypto.randomBytes(32).toString("hex"),
    passwordResetToken: undefined,
    passwordResetExpires: undefined
  };

  users.push(user);
  const verificationUrl = `${process.env.CLIENT_URL}/verify-email/${user.emailVerificationToken}`;

  await sendEmail({
    to: user.email,
    subject: "Confirm your CS Matchmaking account",
    html: verificationEmail(user.username, verificationUrl)
  });

  res.status(201).json({
    message: process.env.SMTP_HOST
      ? "Registration successful. Check your email for the verification link."
      : `Demo mode: SMTP is not configured, so no email was sent. Verification link: ${verificationUrl}`
  });
});

app.post("/api/auth/login", async (req, res) => {
  const { identifier, password } = req.body;
  const normalizedIdentifier = identifier?.toLowerCase();
  const user = users.find(
    (candidate) => candidate.username === identifier || candidate.email === normalizedIdentifier
  );

  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ message: "Invalid credentials" });
  }

  if (!user.isEmailVerified) {
    return res.status(403).json({ message: "Please verify your email before logging in." });
  }

  res.json({ token: signToken(user.id), user: publicUser(user) });
});

app.post("/api/auth/forgot-password", async (req, res) => {
  const normalizedEmail = req.body.email?.trim().toLowerCase();
  const user = users.find((candidate) => candidate.email === normalizedEmail);

  if (!user) {
    console.log(`Password reset requested for unknown email: ${normalizedEmail || "empty"}`);
    return res.status(404).json({ message: "No account found with that email." });
  }

  const resetToken = crypto.randomBytes(32).toString("hex");
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

  try {
    await sendEmail({
      to: user.email,
      subject: "Reset your CS Matchmaking password",
      html: passwordResetEmail(user.username, resetUrl)
    });
  } catch (error) {
    console.error(`Password reset email failed for ${user.email}`);
    console.error(error.message);
    return res.status(502).json({ message: "Could not send reset email. Check SMTP settings." });
  }

  console.log(`Password reset email sent to ${user.email}`);
  res.json({ message: "Password reset email sent. Check your inbox and spam folder." });
});

app.post("/api/auth/reset-password/:token", async (req, res) => {
  if (!req.body.password || req.body.password.length < 8) {
    return res.status(400).json({ message: "Password must be at least 8 characters" });
  }

  const user = users.find(
    (candidate) =>
      candidate.passwordResetToken === req.params.token && candidate.passwordResetExpires > Date.now()
  );

  if (!user) {
    return res.status(400).json({ message: "Invalid or expired reset token" });
  }

  user.password = await bcrypt.hash(req.body.password, 12);
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  res.json({ message: "Password updated" });
});

app.get("/api/auth/verify-email/:token", (req, res) => {
  const user = users.find((candidate) => candidate.emailVerificationToken === req.params.token);

  if (!user) {
    return res.status(400).json({ message: "Invalid verification token" });
  }

  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  res.json({ message: "Email verified. You can log in now." });
});

app.get("/api/sessions", (_req, res) => {
  const upcoming = sessions
    .filter((session) => new Date(session.startsAt) >= new Date())
    .sort((a, b) => new Date(a.startsAt) - new Date(b.startsAt));

  res.json(upcoming);
});

app.post("/api/sessions", auth, (req, res) => {
  const { startsAt, description, mode = "Competitive", skillLevel = "" } = req.body;
  const date = new Date(startsAt);

  if (!startsAt || !description || Number.isNaN(date.getTime()) || date < new Date()) {
    return res.status(400).json({ message: "Valid future date/time and description are required" });
  }

  const session = {
    _id: crypto.randomUUID(),
    host: req.user,
    startsAt: date.toISOString(),
    description,
    mode,
    skillLevel,
    players: [req.user],
    createdAt: new Date().toISOString()
  };

  sessions.push(session);
  res.status(201).json(session);
});

app.post("/api/sessions/:id/join", auth, (req, res) => {
  const session = sessions.find((candidate) => candidate._id === req.params.id);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (!session.players.some((player) => player.id === req.user.id)) {
    session.players.push(req.user);
  }

  res.json(session);
});

app.post("/api/sessions/:id/leave", auth, (req, res) => {
  const session = sessions.find((candidate) => candidate._id === req.params.id);

  if (!session) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (session.host.id === req.user.id) {
    return res.status(400).json({ message: "Hosts can cancel the session instead of leaving it" });
  }

  session.players = session.players.filter((player) => player.id !== req.user.id);
  res.json(session);
});

app.delete("/api/sessions/:id", auth, (req, res) => {
  const index = sessions.findIndex((candidate) => candidate._id === req.params.id);

  if (index === -1) {
    return res.status(404).json({ message: "Session not found" });
  }

  if (sessions[index].host.id !== req.user.id) {
    return res.status(403).json({ message: "Only the host can cancel this session" });
  }

  sessions.splice(index, 1);
  res.json({ message: "Session cancelled", sessionId: req.params.id });
});

app.listen(PORT, () => {
  console.log(`Demo API running on port ${PORT}`);
});
