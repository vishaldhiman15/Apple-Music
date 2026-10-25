const express = require("express"),
  jwt = require("jsonwebtoken"),
  { rateLimit } = require("express-rate-limit");
const { z, wrap, fail } = require("../lib/http"),
  User = require("../models/User"),
  { protect } = require("../middlewares/authMiddleware");
const router = express.Router();
const limit = rateLimit({
  windowMs: 15 * 60000,
  limit: 30,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Try again in 15 minutes." },
});
const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((x) => x.toLowerCase().trim()),
  password: z.string().min(10).max(128),
});
const publicUser = (user) => ({
  _id: String(user._id),
  name: user.name,
  email: user.email,
  avatar: user.avatar,
  favourites: user.favourites,
  recentlyPlayed: user.recentlyPlayed,
});
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "lax",
  secure:
    process.env.COOKIE_SECURE === "true" ||
    process.env.NODE_ENV === "production",
  path: "/api",
  maxAge: 7 * 86400000,
});
const session = (res, user) => {
  const token = jwt.sign({ id: String(user._id) }, process.env.JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "7d",
  });
  res.cookie("music_session", token, cookieOptions());
  return publicUser(user);
};
router.post(
  "/register",
  limit,
  wrap(async (req, res) => {
    const data = credentials
      .extend({ name: z.string().trim().min(1).max(60) })
      .parse(req.body);
    if (await User.exists({ email: data.email }))
      fail("This email is already registered.", 409);
    const user = await User.create(data);
    res.status(201).json(session(res, user));
  }),
);
router.post(
  "/login",
  limit,
  wrap(async (req, res) => {
    const data = z
      .object({
        email: z.string().trim().max(254),
        password: z.string().max(128),
      })
      .parse(req.body);
    const user = await User.findOne({ email: data.email.toLowerCase() }).select(
      "+password",
    );
    if (!user || !(await user.matchPassword(data.password)))
      fail("Incorrect email or password.", 401);
    res.json(session(res, user));
  }),
);
router.post("/logout", (req, res) => {
  res.clearCookie("music_session", {
    path: "/api",
    httpOnly: true,
    sameSite: "lax",
    secure: cookieOptions().secure,
  });
  res.json({ ok: true });
});
router.get("/me", protect, (req, res) => res.json(publicUser(req.user)));
router.patch(
  "/me",
  protect,
  wrap(async (req, res) => {
    const data = z
      .object({ name: z.string().trim().min(1).max(60) })
      .parse(req.body);
    req.user.name = data.name;
    await req.user.save();
    res.json(publicUser(req.user));
  }),
);
module.exports = router;
