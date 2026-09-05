const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')

const userSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  avatar: { type: String, default: 'https://api.dicebear.com/7.x/avataaars/svg?seed=guest' },
  favourites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Song' }],
  recentlyPlayed: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }],
  topPicks: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Album' }] // Assuming topPicks are albums/playlists
}, { timestamps: true })

userSchema.pre('save', async function() {
  if (!this.isModified('password')) return
  this.password = await bcrypt.hash(this.password, 10)
})

userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password)
}

module.exports = mongoose.model('User', userSchema)
