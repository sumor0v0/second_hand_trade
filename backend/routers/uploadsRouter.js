const express = require("express");
const { authMiddleware } = require("../middlewares/authMiddleware");
const { createUploader } = require("../utils/uploader");

const router = express.Router();

const itemUploader = createUploader("items");
const conversationUploader = createUploader("conversations");

router.post("/items", authMiddleware, (req, res, next) => {
  itemUploader.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "File size exceeds limit" });
        return;
      }
      const status = err.status || 400;
      res.status(status).json({ message: err.message || "Upload failed" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "image file is required" });
      return;
    }

    const url = `/uploads/items/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

router.post("/conversations", authMiddleware, (req, res, next) => {
  conversationUploader.single("image")(req, res, (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        res.status(400).json({ message: "File size exceeds limit" });
        return;
      }
      const status = err.status || 400;
      res.status(status).json({ message: err.message || "Upload failed" });
      return;
    }

    if (!req.file) {
      res.status(400).json({ message: "image file is required" });
      return;
    }

    const url = `/uploads/conversations/${req.file.filename}`;
    res.status(201).json({ url });
  });
});

module.exports = router;
