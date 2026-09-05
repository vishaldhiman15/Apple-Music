require('dotenv').config({ path: __dirname + '/.env' })
const express = require('express')
const mongoose = require('mongoose')
const cors = require('cors')

const authRoutes = require('./routes/authRoutes')
const songRoutes = require('./routes/songRoutes')
const playlistRoutes = require('./routes/playlistRoutes')
const userRoutes = require('./routes/userRoutes')

const app = express()

// Middleware
app.use(cors())
app.use(express.json())

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err))

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/songs', songRoutes)
app.use('/api/playlists', playlistRoutes)
app.use('/api/users', userRoutes)

app.get('/api/health', (req, res) => res.send('OK'))

const PORT = process.env.PORT || 5000
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
