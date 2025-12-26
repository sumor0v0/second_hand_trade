const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.get("/:id", async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    const [rows] = await db.query(
      "SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?",
      [userId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put("/:id", authMiddleware, async (req, res, next) => {
  try {
    const userId = Number(req.params.id);
    if (Number.isNaN(userId)) {
      return res.status(400).json({ message: "Invalid user id" });
    }

    if (req.user.id !== userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { username, email, avatar, bio } = req.body || {};
    const fields = [];
    const params = [];

    if (username) {
      fields.push("username = ?");
      params.push(username);
    }

    if (email) {
      fields.push("email = ?");
      params.push(email);
    }

    if (avatar !== undefined) {
      fields.push("avatar = ?");
      params.push(avatar);
    }

    if (bio !== undefined) {
      fields.push("bio = ?");
      params.push(bio);
    }

    if (!fields.length) {
      return res.status(400).json({ message: "No fields to update" });
    }

    params.push(userId);

    await db.query(
      `UPDATE users SET ${fields.join(", ")} WHERE id = ?`,
      params
    );

    const [rows] = await db.query(
      "SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?",
      [userId]
    );

    res.json(rows[0]);
  } catch (error) {
    if (error && error.code === "ER_DUP_ENTRY") {
      return res
        .status(409)
        .json({ message: "Username or email already in use" });
    }
    next(error);
  }
});

module.exports = router;
