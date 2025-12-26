const express = require("express");
const { db } = require("../config/db");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createUploader, conditionalUpload } = require("../utils/uploader");

const router = express.Router();
const itemUploader = createUploader("items");

router.post("/items/:itemId/images", authMiddleware, async (req, res, next) => {
  try {
    const itemId = Number(req.params.itemId);
    const { imageUrl } = req.body || {};

    if (Number.isNaN(itemId)) {
      return res.status(400).json({ message: "Invalid item id" });
    }

    if (typeof imageUrl !== "string" || !imageUrl.trim()) {
      return res.status(400).json({ message: "imageUrl is required" });
    }

    const [items] = await db.query("SELECT seller_id FROM items WHERE id = ?", [
      itemId,
    ]);

    if (!items.length) {
      return res.status(404).json({ message: "Item not found" });
    }

    if (items[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const [result] = await db.query(
      "INSERT INTO item_images (item_id, image_url) VALUES (?, ?)",
      [itemId, imageUrl]
    );

    res.status(201).json({
      id: result.insertId,
      item_id: itemId,
      image_url: imageUrl,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/images/:imageId", authMiddleware, async (req, res, next) => {
  try {
    const imageId = Number(req.params.imageId);
    if (Number.isNaN(imageId)) {
      return res.status(400).json({ message: "Invalid image id" });
    }

    const [rows] = await db.query(
      `SELECT ii.item_id, i.seller_id
         FROM item_images ii
         JOIN items i ON i.id = ii.item_id
        WHERE ii.id = ?`,
      [imageId]
    );

    if (!rows.length) {
      return res.status(404).json({ message: "Image not found" });
    }

    if (rows[0].seller_id !== req.user.id) {
      return res.status(403).json({ message: "Forbidden" });
    }

    await db.query("DELETE FROM item_images WHERE id = ?", [imageId]);

    res.status(204).end();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
