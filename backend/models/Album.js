const mongoose = require('mongoose')

const albumSchema = new mongoose.Schema({
  title: { type: String, required: true },
  artist: { type: mongoose.Schema.Types.ObjectId, ref: 'Artist' },
  coverUrl: { type: String }, // Cloudinary URL
  year: { type: String },
  genre: { type: String }
}, { timestamps: true })

module.exports = mongoose.model('Album', albumSchema)
