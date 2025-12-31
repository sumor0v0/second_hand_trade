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
            "SELECT id, username, phone_num, avatar, bio, balance, created_at FROM users WHERE id = ?",
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

        const { username, phone_num, avatar, bio } = req.body || {};
        const fields = [];
        const params = [];

        if (username) {
            fields.push("username = ?");
            params.push(username);
        }

        if (phone_num) {
            fields.push("phone_num = ?");
            params.push(phone_num);
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
            "SELECT id, username, phone_num, avatar, bio, balance, created_at FROM users WHERE id = ?",
            [userId]
        );

        res.json(rows[0]);
    } catch (error) {
        if (error && error.code === "ER_DUP_ENTRY") {
            return res
                .status(409)
                .json({ message: "Username or phone number already in use" });
        }
        next(error);
    }
});

router.post("/:id/recharge", authMiddleware, async (req, res, next) => {
    try {
        const userId = Number(req.params.id);
        if (Number.isNaN(userId)) {
            return res.status(400).json({ message: "Invalid user id" });
        }

        if (req.user.id !== userId) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { amount } = req.body || {};
        const numericAmount = Number.parseFloat(amount);

        if (!Number.isFinite(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ message: "充值金额需大于 0" });
        }

        await db.query("UPDATE users SET balance = balance + ? WHERE id = ?", [
            numericAmount,
            userId,
        ]);

        const [rows] = await db.query(
            "SELECT id, username, phone_num, avatar, bio, balance, created_at FROM users WHERE id = ?",
            [userId]
        );

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

module.exports = router;
