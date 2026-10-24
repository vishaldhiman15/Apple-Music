require("dotenv").config({ path: __dirname + "/.env", quiet: true });
const mongoose = require("mongoose"),
  fs = require("node:fs"),
  path = require("node:path"),
  Artist = require("./models/Artist"),
  Album = require("./models/Album"),
  Song = require("./models/Song");
async function seed() {
  const catalog = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../src/data/catalog.json"), "utf8"),
  );
  for (const a of catalog.artists)
    await Artist.updateOne(
      { _id: a.id },
      { $setOnInsert: { name: a.name, image: a.image } },
      { upsert: true },
    );
  for (const a of catalog.albums)
    await Album.updateOne(
      { _id: a.id },
      {
        $setOnInsert: {
          title: a.title,
          artist: a.artistId,
          coverUrl: a.coverUrl,
          year: a.year,
          genre: a.genre,
        },
      },
      { upsert: true },
    );
  for (const s of catalog.songs) {
    const { id, albumTitle, artistId, artist, ...fields } = s;
    await Song.updateOne(
      { _id: id },
      { $setOnInsert: { ...fields, artist: artistId } },
      { upsert: true },
    );
  }
  return catalog.songs.length;
}
if (require.main === module)
  mongoose
    .connect(process.env.MONGODB_URI)
    .then(seed)
    .then((n) =>
      console.log(
        `Ready: ${n} original demo recordings. Existing data was preserved.`,
      ),
    )
    .finally(() => mongoose.disconnect());
module.exports = { seed };
