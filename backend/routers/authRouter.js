const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

function createToken(userId) {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET is not defined in environment variables");
    }
    return jwt.sign({ userId }, secret, { expiresIn: "7d" });
}

router.post("/register", async (req, res, next) => {
    try {
        const { username, phone_num, password } = req.body || {};

        if (!username || !phone_num || !password) {
            return res.status(400).json({
                message: "username, phone_num and password are required",
            });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE username = ? OR phone_num = ? LIMIT 1",
            [username, phone_num]
        );

        if (existing.length) {
            return res
                .status(409)
                .json({ message: "Username or phone number already in use" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (username, phone_num, password_hash) VALUES (?, ?, ?)",
            [username, phone_num, passwordHash]
        );

        const token = createToken(result.insertId);

        res.status(201).json({
            token,
            user: {
                id: result.insertId,
                username,
                phone_num,
                avatar: null,
                balance: 0,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post("/login", async (req, res, next) => {
    try {
        const { identifier, password } = req.body || {};

        if (!identifier || !password) {
            return res
                .status(400)
                .json({ message: "identifier and password are required" });
        }

        const [rows] = await db.query(
            "SELECT id, username, phone_num, avatar, balance, password_hash FROM users WHERE username = ? OR phone_num = ? LIMIT 1",
            [identifier, identifier]
        );

        if (!rows.length) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password_hash);

        if (!isMatch) {
            return res.status(401).json({ message: "Invalid credentials" });
        }

        const token = createToken(user.id);

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                phone_num: user.phone_num,
                avatar: user.avatar,
                balance: user.balance,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.post("/reset-password", async (req, res, next) => {
    try {
        const { identifier, newPassword } = req.body || {};

        if (!identifier) {
            return res.status(400).json({ message: "identifier is required" });
        }

        const [rows] = await db.query(
            "SELECT id FROM users WHERE username = ? OR phone_num = ? LIMIT 1",
            [identifier, identifier]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "User not found" });
        }

        const passwordValue =
            typeof newPassword === "string" && newPassword.trim().length
                ? newPassword.trim()
                : "123456";

        if (passwordValue.length < 6) {
            return res.status(400).json({
                message: "New password must be at least 6 characters",
            });
        }

        const passwordHash = await bcrypt.hash(passwordValue, 10);

        await db.query("UPDATE users SET password_hash = ? WHERE id = ?", [
            passwordHash,
            rows[0].id,
        ]);

        res.json({
            message: "Password reset successfully",
            password: passwordValue,
        });
    } catch (error) {
        next(error);
    }
});

router.get("/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
