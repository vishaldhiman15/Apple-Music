const express = require('express')
const router = express.Router()
const Song = require('../models/Song')
const Album = require('../models/Album')
const Artist = require('../models/Artist')
const { protect } = require('../middlewares/authMiddleware')
const { cloudinary } = require('../config/cloudinary')

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

// @route   GET /api/songs/signature
// @desc    Get Cloudinary signature for direct upload
// @access  Private
router.get('/signature', protect, (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000)
    // Create signature for audio upload
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'applemusic/audio'
    }, process.env.CLOUDINARY_API_SECRET)

    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/songs/cover-signature
// @desc    Get Cloudinary signature for direct cover upload
// @access  Private
router.get('/cover-signature', protect, (req, res) => {
  try {
    const timestamp = Math.round((new Date).getTime() / 1000)
    const signature = cloudinary.utils.api_sign_request({
      timestamp: timestamp,
      folder: 'applemusic/images'
    }, process.env.CLOUDINARY_API_SECRET)

    res.json({
      signature,
      timestamp,
      cloudName: process.env.CLOUDINARY_CLOUD_NAME,
      apiKey: process.env.CLOUDINARY_API_KEY
    })
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   POST /api/songs/upload
// @desc    Save new song details to DB
// @access  Private
router.post('/upload', protect, async (req, res) => {
  try {
    const { title, artistName, albumTitle, duration, genre, releaseYear, explicit, audioUrl, coverUrl } = req.body

    if (!audioUrl) {
      return res.status(400).json({ message: 'Audio URL is required' })
    }

    const finalCoverUrl = coverUrl || 'https://via.placeholder.com/200/2a2a2c/666?text=New'

    let artist = await Artist.findOne({ name: artistName })
    if (!artist) {
      artist = await Artist.create({ name: artistName, image: finalCoverUrl })
    }

    let album = await Album.findOne({ title: albumTitle, artist: artist._id })
    if (!album) {
      album = await Album.create({ title: albumTitle, artist: artist._id, coverUrl: finalCoverUrl, year: releaseYear || new Date().getFullYear().toString(), genre })
    }

    const newSong = await Song.create({
      title,
      artist: artist._id,
      albumId: album._id,
      duration: Number(duration),
      audioUrl,
      coverUrl: finalCoverUrl,
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
