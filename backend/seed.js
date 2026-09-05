require('dotenv').config({ path: __dirname + '/.env' })
const mongoose = require('mongoose')
const User = require('./models/User')
const Song = require('./models/Song')
const Album = require('./models/Album')
const Artist = require('./models/Artist')
const Playlist = require('./models/Playlist')

const seedData = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI)
    console.log('MongoDB Connected for Seeding')

    // Clear existing data
    await User.deleteMany()
    await Song.deleteMany()
    await Album.deleteMany()
    await Artist.deleteMany()
    await Playlist.deleteMany()

    // Create Artists
    const hansZimmer = await Artist.create({ name: 'Hans Zimmer', image: 'https://images.unsplash.com/photo-1516280440502-86103b412152?w=800&q=80' })
    const weekend = await Artist.create({ name: 'The Weeknd', image: 'https://images.unsplash.com/photo-1618090584122-262be64e0a9f?w=800&q=80' })
    const enigma = await Artist.create({ name: 'Enigma', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=800&q=80' })
    
    // Create Albums
    const interstellar = await Album.create({ title: 'Interstellar', artist: hansZimmer._id, coverUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?w=800&q=80', year: '2014', genre: 'Soundtrack' })
    const starboy = await Album.create({ title: 'Starboy', artist: weekend._id, coverUrl: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?w=800&q=80', year: '2016', genre: 'R&B' })
    const leRoi = await Album.create({ title: 'Le Roi Est Mort, Vive Le Roi!', artist: enigma._id, coverUrl: 'https://images.unsplash.com/photo-1619983081563-430f63602796?w=800&q=80', year: '1996', genre: 'Pop' })

    // Create Songs
    const s1 = await Song.create({ title: 'Cornfield Chase', artist: hansZimmer._id, albumId: interstellar._id, duration: 126, coverUrl: interstellar.coverUrl, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', genre: 'Soundtrack' })
    const s2 = await Song.create({ title: 'Starboy', artist: weekend._id, albumId: starboy._id, duration: 230, coverUrl: starboy.coverUrl, audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', genre: 'R&B' })
    const s3 = await Song.create({ 
      title: 'The Child In Us', 
      artist: enigma._id, 
      albumId: leRoi._id, 
      duration: 306, 
      coverUrl: leRoi.coverUrl, 
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', 
      genre: 'Pop',
      releaseYear: '1996',
      composer: 'Michael Cretu',
      trackNumber: 7,
      discNumber: 1,
      lyrics: `प्रसन्न-वदानं सौभाग्यदं भाग्यदं
हस्ताभ्यां अभय-प्रदानं मणि-गणैर्
नानाविधैर् भूषिताम्
प्रसन्न-वदानं सौभाग्यदं भाग्यदं
हस्ताभ्यां अभय-प्रदानं मणि-गणैर्
नानाविधैर् भूषिताम्
Puer natus est nobis
Et filius datus est nobis
Cuius imperium super humerum
Admirabilis, Consiliarius, Deus, Fortis
प्रसन्न-वदानं सौभाग्यदं भाग्यदं
हस्ताभ्यां अभय-प्रदानं मणि-गणैर्
नानाविधैर् भूषिताम्
Someday you came
And I knew you were the one
You were the rain, you were the sun
But I needed both, 'cause I needed you
You were the one
I was dreaming of all my life
When it's dark, you are my light
But don't forget who's always our guide
It is the child in us
It is the child in us

Written By: Michael Cretu`
    })

    // Create Users
    const tourist = await User.create({ name: 'Tourist', email: 'tourist@example.com', password: 'password123', favourites: [s1._id, s3._id], recentlyPlayed: [interstellar._id, leRoi._id] })
    const guest = await User.create({ name: 'Guest', email: 'guest@example.com', password: 'password123', favourites: [s2._id], recentlyPlayed: [starboy._id] })

    console.log('Database Seeded Successfully!')
    process.exit(0)
  } catch (error) {
    console.error('Seeding Error:', error)
    process.exit(1)
  }
}

seedData()
