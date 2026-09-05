const express = require('express')
const router = express.Router()
const Song = require('../models/Song')
const Album = require('../models/Album')
const Artist = require('../models/Artist')
const { protect } = require('../middlewares/authMiddleware')
const { upload } = require('../config/cloudinary')

// @route   GET /api/songs
// @desc    Get all songs
// @access  Public
router.get('/', async (req, res) => {
  try {
    const songs = await Song.find().populate('artist').populate('albumId')
    res.json(songs)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   POST /api/songs/upload
// @desc    Upload a new song and cover art to Cloudinary
// @access  Private (In a real app, maybe Admin only. We allow users here for demo)
router.post('/upload', protect, upload.fields([{ name: 'audio', maxCount: 1 }, { name: 'cover', maxCount: 1 }]), async (req, res) => {
  try {
    const { title, artistName, albumTitle, duration, genre, releaseYear, explicit } = req.body

    if (!req.files || !req.files.audio) {
      return res.status(400).json({ message: 'Audio file is required' })
    }

    const audioUrl = req.files.audio[0].path
    const coverUrl = req.files.cover ? req.files.cover[0].path : 'https://via.placeholder.com/200/2a2a2c/666?text=New'

    // Simple create/find Artist & Album for this demo
    let artist = await Artist.findOne({ name: artistName })
    if (!artist) {
      artist = await Artist.create({ name: artistName, image: coverUrl })
    }

    let album = await Album.findOne({ title: albumTitle, artist: artist._id })
    if (!album) {
      album = await Album.create({ title: albumTitle, artist: artist._id, coverUrl, year: releaseYear || new Date().getFullYear().toString(), genre })
    }

    const newSong = await Song.create({
      title,
      artist: artist._id,
      albumId: album._id,
      duration: Number(duration),
      audioUrl,
      coverUrl,
      genre,
      releaseYear,
      explicit: explicit === 'true' || explicit === true
    })

    res.status(201).json(newSong)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
