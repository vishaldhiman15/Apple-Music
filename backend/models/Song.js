const mongoose = require("mongoose");
const schema = new mongoose.Schema(
  {
    title: { type: String, required: true, maxLength: 150 },
    artist: { type: mongoose.Schema.Types.ObjectId, ref: "Artist" },
    albumId: { type: mongoose.Schema.Types.ObjectId, ref: "Album" },
    duration: { type: Number, required: true, min: 0, max: 86400 },
    coverUrl: String,
    audioUrl: { type: String, required: true },
    audioPublicId: String,
    genre: String,
    releaseYear: String,
    explicit: { type: Boolean, default: false },
    plays: { type: Number, default: 0 },
    lyrics: { type: String, maxLength: 50000 },
    composer: String,
    trackNumber: Number,
    discNumber: Number,
    instrumental: { type: Boolean, default: false },
    demo: { type: Boolean, default: false },
    color: String,
    bpm: Number,
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
schema.index({ title: "text", genre: "text" });
module.exports = mongoose.model("Song", schema);
