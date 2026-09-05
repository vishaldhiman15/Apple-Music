const express = require('express')
const router = express.Router()
const User = require('../models/User')
const { protect } = require('../middlewares/authMiddleware')

// @route   PUT /api/users/favourites
// @desc    Toggle a song in favourites
// @access  Private
router.put('/favourites', protect, async (req, res) => {
  try {
    const { songId } = req.body
    const user = await User.findById(req.user._id)

    if (user.favourites.includes(songId)) {
      user.favourites = user.favourites.filter(id => id.toString() !== songId)
    } else {
      user.favourites.push(songId)
    }

    await user.save()
    res.json(user.favourites)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

// @route   PUT /api/users/recently-played
// @desc    Add album to recently played
// @access  Private
router.put('/recently-played', protect, async (req, res) => {
  try {
    const { albumId } = req.body
    const user = await User.findById(req.user._id)

    // Remove if exists, then unshift to front
    user.recentlyPlayed = user.recentlyPlayed.filter(id => id.toString() !== albumId)
    user.recentlyPlayed.unshift(albumId)
    
    // Keep only last 10
    user.recentlyPlayed = user.recentlyPlayed.slice(0, 10)

    await user.save()
    res.json(user.recentlyPlayed)
  } catch (error) {
    res.status(500).json({ message: error.message })
  }
})

module.exports = router
