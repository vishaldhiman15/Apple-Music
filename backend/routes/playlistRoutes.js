const express = require('express')
const router = express.Router()
const Playlist = require('../models/Playlist')
const { protect } = require('../middlewares/authMiddleware')

// @route   POST /api/playlists
// @desc    Create a new playlist
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { name } = req.body
    const playlist = await Playlist.create({
      name,
      user: req.user._id,
      songs: []
    })
    res.status(201).json(playlist)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   GET /api/playlists
// @desc    Get user's playlists
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    const playlists = await Playlist.find({ user: req.user._id }).populate('songs')
    res.json(playlists)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/playlists/:id/add-song
// @desc    Add a song to a playlist
// @access  Private
router.put('/:id/add-song', protect, async (req, res) => {
  try {
    const { songId } = req.body
    const playlist = await Playlist.findById(req.params.id)

    if (!playlist) {
      return res.status(404).json({ message: 'Playlist not found' })
    }

    if (playlist.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'Not authorized' })
    }

    if (!playlist.songs.includes(songId)) {
      playlist.songs.push(songId)
      await playlist.save()
    }

    res.json(playlist)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
