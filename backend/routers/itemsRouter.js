const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res, next) => {
    try {
        const { title, description, price, status } = req.body || {};

        if (!title || !price) {
            return res
                .status(400)
                .json({ message: "title and price are required" });
        }

        const [result] = await db.query(
            "INSERT INTO items (seller_id, title, description, price, status) VALUES (?, ?, ?, ?, ?)",
            [req.user.id, title, description || "", price, status || "on_sale"]
        );

        const [rows] = await db.query(
            `SELECT i.id, i.title, i.description, i.price, i.status, i.created_at,
              u.username AS seller_name
         FROM items i
         JOIN users u ON u.id = i.seller_id
        WHERE i.id = ?`,
            [result.insertId]
        );

        res.status(201).json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.get("/", async (req, res, next) => {
    try {
        const { keyword, minPrice, maxPrice, sellerId, status } =
            req.query || {};

        const clauses = [];
        const params = [];

        if (keyword) {
            clauses.push("(i.title LIKE ? OR i.description LIKE ?)");
            params.push(`%${keyword}%`, `%${keyword}%`);
        }

        if (minPrice) {
            clauses.push("i.price >= ?");
            params.push(minPrice);
        }

        if (maxPrice) {
            clauses.push("i.price <= ?");
            params.push(maxPrice);
        }

        if (sellerId) {
            clauses.push("i.seller_id = ?");
            params.push(sellerId);
        }

        if (status) {
            clauses.push("i.status = ?");
            params.push(status);
        }

        const whereClause = clauses.length
            ? `WHERE ${clauses.join(" AND ")}`
            : "";

        const [rows] = await db.query(
            `SELECT i.id, i.title, i.description, i.price, i.status, i.created_at,
              u.username AS seller_name,
              (SELECT image_url FROM item_images WHERE item_id = i.id LIMIT 1) AS cover_image
         FROM items i
         JOIN users u ON u.id = i.seller_id
         ${whereClause}
         ORDER BY i.created_at DESC`,
            params
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.get("/:id", async (req, res, next) => {
    try {
        const itemId = Number(req.params.id);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({ message: "Invalid item id" });
        }

        const [rows] = await db.query(
            `SELECT i.id, i.title, i.description, i.price, i.status, i.created_at,
              i.seller_id, u.username AS seller_name
         FROM items i
         JOIN users u ON u.id = i.seller_id
        WHERE i.id = ?`,
            [itemId]
        );

        if (!rows.length) {
            return res.status(404).json({ message: "Item not found" });
        }

        const item = rows[0];
        const [images] = await db.query(
            "SELECT id, image_url FROM item_images WHERE item_id = ?",
            [itemId]
        );

        res.json({ ...item, images });
    } catch (error) {
        next(error);
    }
});

router.put("/:id", authMiddleware, async (req, res, next) => {
    try {
        const itemId = Number(req.params.id);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({ message: "Invalid item id" });
        }

        const [items] = await db.query(
            "SELECT seller_id FROM items WHERE id = ?",
            [itemId]
        );
        if (!items.length) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (items[0].seller_id !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        const { title, description, price, status } = req.body || {};

        const fields = [];
        const params = [];

        if (title !== undefined) {
            fields.push("title = ?");
            params.push(title);
        }

        if (description !== undefined) {
            fields.push("description = ?");
            params.push(description);
        }

        if (price !== undefined) {
            fields.push("price = ?");
            params.push(price);
        }

        if (status !== undefined) {
            fields.push("status = ?");
            params.push(status);
        }

        if (!fields.length) {
            return res.status(400).json({ message: "No fields to update" });
        }

        params.push(itemId);

        await db.query(
            `UPDATE items SET ${fields.join(", ")} WHERE id = ?`,
            params
        );

        const [rows] = await db.query(
            `SELECT i.id, i.title, i.description, i.price, i.status, i.created_at,
              i.seller_id, u.username AS seller_name
         FROM items i
         JOIN users u ON u.id = i.seller_id
        WHERE i.id = ?`,
            [itemId]
        );

        res.json(rows[0]);
    } catch (error) {
        next(error);
    }
});

router.delete("/:id", authMiddleware, async (req, res, next) => {
    try {
        const itemId = Number(req.params.id);
        if (Number.isNaN(itemId)) {
            return res.status(400).json({ message: "Invalid item id" });
        }

        const [items] = await db.query(
            "SELECT seller_id FROM items WHERE id = ?",
            [itemId]
        );
        if (!items.length) {
            return res.status(404).json({ message: "Item not found" });
        }

        if (items[0].seller_id !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        await db.query("UPDATE items SET status = 'removed' WHERE id = ?", [
            itemId,
        ]);

        res.status(204).end();
    } catch (error) {
        next(error);
    }
});

module.exports = router;
