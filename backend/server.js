require("./config/env");
const express = require("express"),
  mongoose = require("mongoose"),
  cors = require("cors"),
  helmet = require("helmet"),
  cookieParser = require("cookie-parser"),
  { rateLimit } = require("express-rate-limit"),
  { z } = require("zod");
const app = express();
app.disable("x-powered-by");
const allowed = new Set(
  (
    process.env.APP_ORIGINS ||
    "http://localhost:3000,http://127.0.0.1:3000,http://localhost:5173,http://127.0.0.1:5173,http://localhost:4173,http://127.0.0.1:4173"
  )
    .split(",")
    .map((s) => s.trim()),
);
app.use(helmet());
app.use(
  cors({
    origin: (origin, cb) => cb(null, !origin || allowed.has(origin)),
    credentials: true,
  }),
);
app.use(express.json({ limit: "150kb" }));
app.use(cookieParser());
app.use("/api", (req, res, next) => {
  res.set("Cache-Control", "no-store");
  if (!["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (req.get("X-Music-Request") !== "1")
      return res
        .status(403)
        .json({ message: "Request protection header required." });
    if (req.get("origin") && !allowed.has(req.get("origin")))
      return res.status(403).json({ message: "Origin not allowed." });
  }
  next();
});
app.use(
  "/api",
  rateLimit({
    windowMs: 60000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: { message: "Too many requests. Try again shortly." },
  }),
);
app.get("/api/health", (req, res) =>
  res.json({
    ok: true,
    database:
      mongoose.connection.readyState === 1 ? "connected" : "unavailable",
    uploads: require("./config/cloudinary").configured(),
  }),
);
app.use("/api", (req, res, next) =>
  mongoose.connection.readyState === 1
    ? next()
    : res.status(503).json({
        message:
          "Account sync is unavailable. Your device library still works.",
      }),
);
app.use("/api/catalog", require("./routes/catalogRoutes"));
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/songs", require("./routes/songRoutes"));
app.use("/api/playlists", require("./routes/playlistRoutes"));
app.use("/api/users", require("./routes/userRoutes"));
app.use("/api", (req, res) =>
  res.status(404).json({ message: "Endpoint not found." }),
);
app.use((err, req, res, next) => {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      message: err.issues
        .map((i) => i.path.join(".") + ": " + i.message)
        .join("; "),
    });
  if (err.status) return res.status(err.status).json({ message: err.message });
  if (err.code === 11000)
    return res.status(409).json({ message: "That record already exists." });
  if (
    err.name === "CastError" ||
    err.name === "ValidationError" ||
    err.type === "entity.parse.failed"
  )
    return res.status(400).json({ message: "Invalid request data." });
  console.error(err.name, err.message);
  res.status(500).json({ message: "Something went wrong. Please try again." });
});
async function connect() {
  if (!process.env.MONGODB_URI)
    throw Error(
      "Set MONGODB_URI to start the account server. Device-only mode does not need a server.",
    );
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32)
    throw Error("JWT_SECRET must contain at least 32 random characters.");
  await mongoose.connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 5000,
  });
}
if (require.main === module)
  connect()
    .then(() =>
      app.listen(
        Number(process.env.PORT || 5001),
        process.env.HOST || "127.0.0.1",
        () =>
          console.log(
            `Music API ready on http://localhost:${process.env.PORT || 5001}`,
          ),
      ),
    )
    .catch((e) => {
      console.error(e.message);
      process.exitCode = 1;
    });
module.exports = { app, connect };
