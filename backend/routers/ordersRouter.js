const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");

const router = express.Router();

router.post("/", authMiddleware, async (req, res, next) => {
    try {
        const { itemId } = req.body || {};

        if (!itemId) {
            return res.status(400).json({ message: "itemId is required" });
        }

        const [items] = await db.query(
            "SELECT id, seller_id, price, status FROM items WHERE id = ?",
            [itemId]
        );

        if (!items.length) {
            return res.status(404).json({ message: "Item not found" });
        }

        const item = items[0];

        if (item.status !== "on_sale") {
            return res.status(400).json({ message: "Item is not available" });
        }

        if (item.seller_id === req.user.id) {
            return res
                .status(400)
                .json({ message: "Cannot purchase own item" });
        }

        const [result] = await db.query(
            "INSERT INTO orders (buyer_id, item_id, price, status) VALUES (?, ?, ?, 'pending')",
            [req.user.id, itemId, item.price]
        );

        res.status(201).json({
            id: result.insertId,
            buyer_id: req.user.id,
            item_id: itemId,
            price: item.price,
            status: "pending",
        });
    } catch (error) {
        next(error);
    }
});

router.get("/my", authMiddleware, async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT o.id, o.item_id, o.price, o.status, o.created_at,
              i.title AS item_title
         FROM orders o
         JOIN items i ON i.id = o.item_id
        WHERE o.buyer_id = ?
        ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.put("/:id/pay", authMiddleware, async (req, res, next) => {
    try {
        const orderId = Number(req.params.id);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const [orders] = await db.query(
            "SELECT id, buyer_id, status FROM orders WHERE id = ?",
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[0];

        if (order.buyer_id !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (order.status !== "pending") {
            return res.status(400).json({ message: "Order cannot be paid" });
        }

        await db.query("UPDATE orders SET status = 'paid' WHERE id = ?", [
            orderId,
        ]);

        res.json({ id: orderId, status: "paid" });
    } catch (error) {
        next(error);
    }
});

router.put("/:id/cancel", authMiddleware, async (req, res, next) => {
    try {
        const orderId = Number(req.params.id);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const [orders] = await db.query(
            "SELECT id, buyer_id, status FROM orders WHERE id = ?",
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[0];

        if (order.buyer_id !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (order.status === "completed") {
            return res
                .status(400)
                .json({ message: "Completed orders cannot be cancelled" });
        }

        await db.query("UPDATE orders SET status = 'cancelled' WHERE id = ?", [
            orderId,
        ]);

        res.json({ id: orderId, status: "cancelled" });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
