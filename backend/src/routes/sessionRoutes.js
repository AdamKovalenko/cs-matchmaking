import express from "express";
import {
  cancelSession,
  createSession,
  getSessions,
  joinSession,
  leaveSession
} from "../controllers/sessionController.js";
import { requireAuth } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getSessions);
router.post("/", requireAuth, createSession);
router.post("/:id/join", requireAuth, joinSession);
router.post("/:id/leave", requireAuth, leaveSession);
router.delete("/:id", requireAuth, cancelSession);

export default router;
