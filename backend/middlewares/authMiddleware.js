const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const User = require("../models/User");
const protect = async (req, res, next) => {
  const token = req.cookies?.music_session;
  if (!token)
    return res
      .status(401)
      .json({ message: "Please sign in to sync your library." });
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET, {
      algorithms: ["HS256"],
    });
    if (!mongoose.isValidObjectId(decoded.id)) throw Error("Invalid session");
    const user = await User.findById(decoded.id);
    if (!user) throw Error("Account unavailable");
    req.user = user;
    next();
  } catch {
    return res
      .status(401)
      .json({ message: "Your session has expired. Please sign in again." });
  }
};
module.exports = { protect };
