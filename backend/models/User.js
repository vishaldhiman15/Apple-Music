const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 60 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: { type: String, required: true, select: false },
    avatar: { type: String, default: "" },
    favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
    recentlyPlayed: [{ type: mongoose.Schema.Types.ObjectId, ref: "Album" }],
  },
  { timestamps: true },
);
schema.pre("save", async function () {
  if (this.isModified("password"))
    this.password = await bcrypt.hash(this.password, 12);
});
schema.methods.matchPassword = function (value) {
  return bcrypt.compare(value, this.password);
};
module.exports = mongoose.model("User", schema);
