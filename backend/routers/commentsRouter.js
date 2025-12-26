const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post(
  "/items/:itemId/comments",
  authMiddleware,
  async (req, res, next) => {
    try {
      const itemId = Number(req.params.itemId);
      const { content } = req.body || {};

      if (Number.isNaN(itemId)) {
        return res.status(400).json({ message: "Invalid item id" });
      }

      if (!content) {
        return res.status(400).json({ message: "content is required" });
      }

      const [items] = await db.query("SELECT id FROM items WHERE id = ?", [
        itemId,
      ]);
      if (!items.length) {
        return res.status(404).json({ message: "Item not found" });
      }

      const [result] = await db.query(
        "INSERT INTO comments (item_id, user_id, content) VALUES (?, ?, ?)",
        [itemId, req.user.id, content]
      );

      const [rows] = await db.query(
        `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username
         FROM comments c
         JOIN users u ON u.id = c.user_id
        WHERE c.id = ?`,
        [result.insertId]
      );

      res.status(201).json(rows[0]);
    } catch (error) {
      next(error);
    }
  }
);

router.get("/items/:itemId/comments", async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    const [rows] = await db.query(
      `SELECT c.id, c.content, c.created_at, u.id AS user_id, u.username
         FROM comments c
         JOIN users u ON u.id = c.user_id
        WHERE c.item_id = ?
        ORDER BY c.created_at DESC`,
      [itemId]
    );

    res.json(rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
