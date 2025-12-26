require("dotenv").config();
const path = require("path");
const http = require("http");
const express = require("express");
const { db } = require("./config/db");
const authRouter = require("./routers/authRouter");
const userRouter = require("./routers/userRouter");
const itemsRouter = require("./routers/itemsRouter");
const imagesRouter = require("./routers/imagesRouter");
const commentsRouter = require("./routers/commentsRouter");
const ordersRouter = require("./routers/ordersRouter");
const conversationsRouter = require("./routers/conversationsRouter");
const uploadsRouter = require("./routers/uploadsRouter");
const morgan = require("morgan");
const cors = require("cors")({
  origin: "http://localhost:5173",
  credentials: true,
});

const PORT = Number(process.env.PORT) || 3000;
const app = express();

app.use(express.json());
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use(morgan("dev"));
app.use(cors);

app.use("/api/auth", authRouter);
app.use("/api/users", userRouter);
app.use("/api/items", itemsRouter);
app.use("/api/uploads", uploadsRouter);
app.use("/api", imagesRouter);
app.use("/api", commentsRouter);
app.use("/api/orders", ordersRouter);
app.use("/api/conversations", conversationsRouter);

app.use((req, res) => {
  res.status(404).json({ message: "Not found" });
});

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || (err.name === "UnauthorizedError" ? 401 : 500);
  res.status(status).json({ message: err.message || "Internal Server Error" });
});

(async () => {
  try {
    const connection = await db.getConnection();
    console.log("Connected to database successfully.");
    connection.release();
  } catch (err) {
    console.error("Failed to connect to database", err);
  }
})();

const server = http.createServer(app);

server.listen(PORT, () => {
  const dbConfig = db.pool && db.pool.config && db.pool.config.connectionConfig;
  const dbPort = dbConfig ? dbConfig.port : "unknown";
  console.log(`数据库端口: ${dbPort}`);
  console.log(`服务器启动成功，正运行在${PORT}端口`);
});
