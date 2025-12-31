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

router.get("/seller", authMiddleware, async (req, res, next) => {
    try {
        const [rows] = await db.query(
            `SELECT o.id, o.item_id, o.price, o.status, o.created_at,
              i.title AS item_title
         FROM orders o
         JOIN items i ON i.id = o.item_id
        WHERE i.seller_id = ?
        ORDER BY o.created_at DESC`,
            [req.user.id]
        );

        res.json(rows);
    } catch (error) {
        next(error);
    }
});

router.put("/:id/pay", authMiddleware, async (req, res, next) => {
    let connection;
    try {
        const orderId = Number(req.params.id);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        connection = await db.getConnection();
        await connection.beginTransaction();

        const [orders] = await connection.query(
            `SELECT o.id, o.buyer_id, o.price, o.status, o.item_id,
                    i.seller_id, i.status AS item_status
               FROM orders o
               JOIN items i ON i.id = o.item_id
              WHERE o.id = ?
              FOR UPDATE`,
            [orderId]
        );

        if (!orders.length) {
            await connection.rollback();
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[0];

        if (order.buyer_id !== req.user.id) {
            await connection.rollback();
            return res.status(403).json({ message: "Forbidden" });
        }

        if (order.status !== "pending") {
            await connection.rollback();
            return res.status(400).json({ message: "Order cannot be paid" });
        }

        const [buyerRows] = await connection.query(
            "SELECT balance FROM users WHERE id = ? FOR UPDATE",
            [order.buyer_id]
        );

        const [sellerRows] = await connection.query(
            "SELECT balance FROM users WHERE id = ? FOR UPDATE",
            [order.seller_id]
        );

        if (!buyerRows.length || !sellerRows.length) {
            await connection.rollback();
            return res.status(404).json({ message: "User not found" });
        }

        const buyerBalance = Number.parseFloat(buyerRows[0].balance || 0);
        const price = Number.parseFloat(order.price || 0);

        if (!Number.isFinite(price) || price <= 0) {
            await connection.rollback();
            return res.status(400).json({ message: "Invalid order price" });
        }

        if (buyerBalance < price) {
            await connection.rollback();
            return res.status(400).json({ message: "余额不足" });
        }

        await connection.query(
            "UPDATE users SET balance = balance - ? WHERE id = ?",
            [price, order.buyer_id]
        );

        await connection.query(
            "UPDATE users SET balance = balance + ? WHERE id = ?",
            [price, order.seller_id]
        );

        await connection.query(
            "UPDATE orders SET status = 'paid' WHERE id = ?",
            [orderId]
        );

        if (order.item_status === "on_sale") {
            await connection.query(
                "UPDATE items SET status = 'sold' WHERE id = ?",
                [order.item_id]
            );
        }

        const [[updatedOrder]] = await connection.query(
            `SELECT o.id, o.price, o.status, o.item_id,
                    i.status AS item_status
               FROM orders o
               JOIN items i ON i.id = o.item_id
              WHERE o.id = ?`,
            [orderId]
        );

        const [[updatedBuyer]] = await connection.query(
            "SELECT balance FROM users WHERE id = ?",
            [order.buyer_id]
        );

        const [[updatedSeller]] = await connection.query(
            "SELECT balance FROM users WHERE id = ?",
            [order.seller_id]
        );

        await connection.commit();

        res.json({
            id: updatedOrder.id,
            status: updatedOrder.status,
            price: updatedOrder.price,
            item_id: updatedOrder.item_id,
            item_status: updatedOrder.item_status,
            buyer_balance: updatedBuyer.balance,
            seller_balance: updatedSeller.balance,
        });
    } catch (error) {
        if (connection) {
            try {
                await connection.rollback();
            } catch (rollbackError) {
                console.error("Failed to rollback transaction", rollbackError);
            }
        }
        next(error);
    } finally {
        if (connection) {
            connection.release();
        }
    }
});

router.put("/:id/ship", authMiddleware, async (req, res, next) => {
    try {
        const orderId = Number(req.params.id);
        if (Number.isNaN(orderId)) {
            return res.status(400).json({ message: "Invalid order id" });
        }

        const [orders] = await db.query(
            `SELECT o.id, o.status, o.item_id, i.seller_id
               FROM orders o
               JOIN items i ON i.id = o.item_id
              WHERE o.id = ?`,
            [orderId]
        );

        if (!orders.length) {
            return res.status(404).json({ message: "Order not found" });
        }

        const order = orders[0];

        if (order.seller_id !== req.user.id) {
            return res.status(403).json({ message: "Forbidden" });
        }

        if (order.status !== "paid") {
            return res
                .status(400)
                .json({ message: "Only paid orders can be shipped" });
        }

        await db.query("UPDATE orders SET status = 'shipped' WHERE id = ?", [
            orderId,
        ]);

        res.json({ id: orderId, status: "shipped" });
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
