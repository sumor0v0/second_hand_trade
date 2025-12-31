const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createUploader } = require("../utils/uploader");

const router = express.Router();

async function ensureConversation(userId, targetUserId) {
    const ordered = [userId, targetUserId].sort((a, b) => a - b);
    const [existing] = await db.query(
        "SELECT id FROM conversations WHERE user1_id = ? AND user2_id = ?",
        ordered
    );

    if (existing.length) {
        return existing[0].id;
    }

    const [result] = await db.query(
        "INSERT INTO conversations (user1_id, user2_id) VALUES (?, ?)",
        ordered
    );

    return result.insertId;
}

router.get("/", authMiddleware, async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT c.id,
              c.user1_id,
              c.user2_id,
              u1.username AS user1_name,
              u1.avatar AS user1_avatar,
              u2.username AS user2_name,
              u2.avatar AS user2_avatar,
              MAX(m.created_at) AS last_message_at
         FROM conversations c
         JOIN users u1 ON u1.id = c.user1_id
         JOIN users u2 ON u2.id = c.user2_id
    LEFT JOIN messages m ON m.conversation_id = c.id
        WHERE c.user1_id = ? OR c.user2_id = ?
        GROUP BY c.id
        ORDER BY last_message_at DESC , c.id DESC`,
            [req.user.id, req.user.id]
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.post("/", authMiddleware, async (req, res, next) => {
    try {
        const { targetUserId } = req.body || {};

        if (!targetUserId) {
            return res
                .status(400)
                .json({ message: "targetUserId is required" });
        }

        if (targetUserId === req.user.id) {
            return res
                .status(400)
                .json({ message: "Cannot create conversation with self" });
        }

        const conversationId = await ensureConversation(
            req.user.id,
            Number(targetUserId)
        );

        const [rows] = await db.query(
            `SELECT c.id,
              c.user1_id,
              c.user2_id,
              u1.username AS user1_name,
              u1.avatar AS user1_avatar,
              u2.username AS user2_name,
              u2.avatar AS user2_avatar
         FROM conversations c
         JOIN users u1 ON u1.id = c.user1_id
         JOIN users u2 ON u2.id = c.user2_id
        WHERE c.id = ?`,
            [conversationId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.get("/:id/messages", authMiddleware, async (req, res, next) => {
    try {
        const conversationId = Number(req.params.id);
        if (Number.isNaN(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        const [conversations] = await db.query(
            "SELECT user1_id, user2_id FROM conversations WHERE id = ?",
            [conversationId]
        );

        if (!conversations.length) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const conversation = conversations[0];

        if (
            conversation.user1_id !== req.user.id &&
            conversation.user2_id !== req.user.id
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const [rows] = await db.query(
            `SELECT m.id, m.sender_id, m.content, m.is_image, m.created_at
         FROM messages m
        WHERE m.conversation_id = ?
        ORDER BY m.created_at ASC`,
            [conversationId]
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.post("/:id/messages", authMiddleware, async (req, res, next) => {
    try {
        const conversationId = Number(req.params.id);
        const { content, is_image = 0 } = req.body || {};

        if (Number.isNaN(conversationId)) {
            return res.status(400).json({ message: "Invalid conversation id" });
        }

        if (typeof content !== "string" || !content.trim()) {
            return res.status(400).json({ message: "content is required" });
        }

        const [conversations] = await db.query(
            "SELECT user1_id, user2_id FROM conversations WHERE id = ?",
            [conversationId]
        );

        if (!conversations.length) {
            return res.status(404).json({ message: "Conversation not found" });
        }

        const conversation = conversations[0];
        if (
            conversation.user1_id !== req.user.id &&
            conversation.user2_id !== req.user.id
        ) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const [result] = await db.query(
            "INSERT INTO messages (conversation_id, sender_id, content, is_image) VALUES (?, ?, ?, ?)",
            [conversationId, req.user.id, content, is_image ? 1 : 0]
        );

        const [rows] = await db.query(
            "SELECT id, sender_id, content, is_image, created_at FROM messages WHERE id = ?",
            [result.insertId]
        );

        const message = {
            conversation_id: conversationId,
            ...rows[0],
        };

        const io = req.app.get("io");
        if (io) {
            io.to(`conversation:${conversationId}`).emit(
                "message:new",
                message
            );
        }

        res.status(201).json(message);
    } catch (err) {
        next(err);
    }
});

router.post(
    "/with/:targetUserId/messages",
    authMiddleware,
    async (req, res, next) => {
        try {
            const targetUserId = Number(req.params.targetUserId);
            const { content, is_image = 0 } = req.body || {};

            if (Number.isNaN(targetUserId)) {
                return res
                    .status(400)
                    .json({ message: "Invalid target user id" });
            }

            if (targetUserId === req.user.id) {
                return res.status(400).json({ message: "Cannot message self" });
            }

            if (typeof content !== "string" || !content.trim()) {
                return res.status(400).json({ message: "content is required" });
            }

            const conversationId = await ensureConversation(
                req.user.id,
                targetUserId
            );

            const [result] = await db.query(
                "INSERT INTO messages (conversation_id, sender_id, content, is_image) VALUES (?, ?, ?, ?)",
                [conversationId, req.user.id, content, is_image ? 1 : 0]
            );

            const [rows] = await db.query(
                "SELECT id, sender_id, content, is_image, created_at FROM messages WHERE id = ?",
                [result.insertId]
            );

            const message = {
                conversation_id: conversationId,
                ...rows[0],
            };

            const io = req.app.get("io");
            if (io) {
                io.to(`conversation:${conversationId}`).emit(
                    "message:new",
                    message
                );
            }

            res.status(201).json(message);
        } catch (err) {
            next(err);
        }
    }
);

module.exports = router;
