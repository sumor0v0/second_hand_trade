const path = require("path");
const fs = require("fs");
const multer = require("multer");

const uploadRoot = path.join(__dirname, "..", "uploads");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function createUploader(subdir) {
  const dir = path.join(uploadRoot, subdir);

  const storage = multer.diskStorage({
    // 决定存储路径
    destination(req, file, cb) {
      ensureDir(dir);
      cb(null, dir);
    },
    // 决定文件名
    filename(req, file, cb) {
      const ext = path.extname(file.originalname) || ".png";
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e6)}`;
      cb(null, `${unique}${ext}`);
    },
  });

  return multer({
    storage,
    fileFilter(req, file, cb) {
      if (!file.mimetype.startsWith("image/")) {
        const error = new Error("Only image uploads are allowed");
        error.status = 400;
        cb(error);
        return;
      }
      cb(null, true);
    },
    limits: {
      fileSize: Number(process.env.UPLOAD_MAX_SIZE || 5 * 1024 * 1024),
    },
  });
}

function conditionalUpload(middleware) {
  return (req, res, next) => {
    const contentType = req.headers["content-type"] || "";
    if (contentType.includes("multipart/form-data")) {
      middleware(req, res, (err) => {
        if (err) {
          if (err.code === "LIMIT_FILE_SIZE") {
            err.status = 400;
            err.message = "File size exceeds limit";
          }
          if (!err.status) {
            err.status = 400;
          }
          next(err);
          return;
        }
        next();
      });
      return;
    }
    next();
  };
}

module.exports = {
  createUploader,
  conditionalUpload,
};
