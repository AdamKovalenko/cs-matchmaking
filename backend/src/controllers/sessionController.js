import Session from "../models/Session.js";

function populateSession(query) {
  return query
    .populate("host", "username email")
    .populate("players", "username email")
    .sort({ startsAt: 1 });
}

export async function createSession(req, res, next) {
  try {
    const { startsAt, description, mode, skillLevel } = req.body;

    if (!startsAt || !description) {
      return res.status(400).json({ message: "Date/time and description are required" });
    }

    const date = new Date(startsAt);
    if (Number.isNaN(date.getTime()) || date < new Date()) {
      return res.status(400).json({ message: "Session date must be a valid future date" });
    }

    const session = await Session.create({
      host: req.user._id,
      startsAt: date,
      description,
      mode,
      skillLevel,
      players: [req.user._id]
    });

    const populated = await Session.findById(session._id)
      .populate("host", "username email")
      .populate("players", "username email");

    res.status(201).json(populated);
  } catch (error) {
    next(error);
  }
}

export async function getSessions(_req, res, next) {
  try {
    const sessions = await populateSession(Session.find({ startsAt: { $gte: new Date() } }));
    res.json(sessions);
  } catch (error) {
    next(error);
  }
}

export async function joinSession(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.startsAt < new Date()) {
      return res.status(400).json({ message: "Cannot join a past session" });
    }

    const alreadyJoined = session.players.some((playerId) => playerId.equals(req.user._id));
    if (!alreadyJoined) {
      session.players.push(req.user._id);
      await session.save();
    }

    const populated = await Session.findById(session._id)
      .populate("host", "username email")
      .populate("players", "username email");

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

export async function leaveSession(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (session.host.equals(req.user._id)) {
      return res.status(400).json({ message: "Hosts can cancel the session instead of leaving it" });
    }

    session.players = session.players.filter((playerId) => !playerId.equals(req.user._id));
    await session.save();

    const populated = await Session.findById(session._id)
      .populate("host", "username email")
      .populate("players", "username email");

    res.json(populated);
  } catch (error) {
    next(error);
  }
}

export async function cancelSession(req, res, next) {
  try {
    const session = await Session.findById(req.params.id);

    if (!session) {
      return res.status(404).json({ message: "Session not found" });
    }

    if (!session.host.equals(req.user._id)) {
      return res.status(403).json({ message: "Only the host can cancel this session" });
    }

    await session.deleteOne();
    res.json({ message: "Session cancelled", sessionId: req.params.id });
  } catch (error) {
    next(error);
  }
}
