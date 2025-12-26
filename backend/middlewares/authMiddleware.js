const jwt = require("jsonwebtoken");
const { db } = require("../config/db");

async function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

    if (!token) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "");
    const [rows] = await db.query(
      "SELECT id, username, email, avatar, bio, created_at FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (!rows.length) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    req.user = rows[0];
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = { authMiddleware };
