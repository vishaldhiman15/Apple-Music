const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxLength: 80 },
    description: { type: String, default: "", maxLength: 500 },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    songs: [{ type: mongoose.Schema.Types.ObjectId, ref: "Song" }],
  },
  { timestamps: true },
);
module.exports = mongoose.model("Playlist", schema);
