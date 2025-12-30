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
        const { username, email, password } = req.body || {};

        if (!username || !email || !password) {
            return res
                .status(400)
                .json({ message: "username, email and password are required" });
        }

        const [existing] = await db.query(
            "SELECT id FROM users WHERE username = ? OR email = ? LIMIT 1",
            [username, email]
        );

        if (existing.length) {
            return res
                .status(409)
                .json({ message: "Username or email already in use" });
        }

        const passwordHash = await bcrypt.hash(password, 10);

        const [result] = await db.query(
            "INSERT INTO users (username, email, password_hash) VALUES (?, ?, ?)",
            [username, email, passwordHash]
        );

        const token = createToken(result.insertId);

        res.status(201).json({
            token,
            user: {
                id: result.insertId,
                username,
                email,
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
            "SELECT id, username, email, avatar, balance, password_hash FROM users WHERE username = ? OR email = ? LIMIT 1",
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
                email: user.email,
                avatar: user.avatar,
                balance: user.balance,
            },
        });
    } catch (error) {
        next(error);
    }
});

router.get("/me", authMiddleware, (req, res) => {
    res.json({ user: req.user });
});

module.exports = router;
