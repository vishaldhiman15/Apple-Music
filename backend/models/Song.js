const mongoose = require('mongoose')

const songSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  albumId: { type: mongoose.Schema.Types.ObjectId, ref: 'Album' },
  duration: { type: Number, required: true }, // in seconds
  coverUrl: { type: String }, // Cloudinary URL
  audioUrl: { type: String, required: true }, // Cloudinary URL
  genre: { type: String },
  releaseYear: { type: String },
  explicit: { type: Boolean, default: false },
  plays: { type: Number, default: 0 },
  lyrics: { type: String },
  composer: { type: String },
  trackNumber: { type: Number },
  discNumber: { type: Number }
}, { timestamps: true })

module.exports = mongoose.model('Song', songSchema)
