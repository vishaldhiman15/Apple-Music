const router = require("express").Router(),
  { rateLimit } = require("express-rate-limit"),
  { z, id, wrap, fail } = require("../lib/http"),
  Song = require("../models/Song"),
  Album = require("../models/Album"),
  Artist = require("../models/Artist"),
  { protect } = require("../middlewares/authMiddleware"),
  { cloudinary, configured } = require("../config/cloudinary");
router.get(
  "/",
  wrap(async (req, res) => {
    res.json(
      await Song.find().populate("artist").populate("albumId").limit(5000),
    );
  }),
);
const uploadLimit = rateLimit({
  windowMs: 3600000,
  limit: 30,
  message: { message: "Upload limit reached. Please try again later." },
});
function sign(req, res, type) {
  if (!configured())
    fail(
      "Cloud uploads are not configured. You can import audio to this device.",
      503,
    );
  const timestamp = Math.round(Date.now() / 1000),
    folder = `applemusic/${type}/${req.user._id}`,
    params = { timestamp, folder };
  res.json({
    ...params,
    signature: cloudinary.utils.api_sign_request(
      params,
      cloudinary.config().api_secret,
    ),
    cloudName: cloudinary.config().cloud_name,
    apiKey: cloudinary.config().api_key,
  });
}
router.get(
  "/signature",
  protect,
  uploadLimit,
  wrap((req, res) => sign(req, res, "audio")),
);
router.get(
  "/cover-signature",
  protect,
  uploadLimit,
  wrap((req, res) => sign(req, res, "images")),
);
router.post(
  "/upload",
  protect,
  uploadLimit,
  wrap(async (req, res) => {
    if (!configured())
      fail(
        "Cloud uploads are not configured. You can import audio to this device.",
        503,
      );
    const data = z
      .object({
        title: z.string().trim().min(1).max(150),
        artistName: z.string().trim().min(1).max(100),
        albumTitle: z.string().trim().min(1).max(150),
        genre: z.string().max(40),
        releaseYear: z.string().regex(/^\d{4}$/),
        audioPublicId: z.string().max(300),
        coverPublicId: z.string().max(300).optional(),
        lyrics: z.string().max(50000).default(""),
        instrumental: z.boolean().default(false),
      })
      .parse(req.body);
    if (!data.audioPublicId.startsWith(`applemusic/audio/${req.user._id}/`))
      fail("Upload ownership could not be verified.", 403);
    const audio = await cloudinary.api.resource(data.audioPublicId, {
      resource_type: "video",
      media_metadata: true,
    });
    if (
      (!audio.has_audio && !audio.audio_codec) ||
      !Number.isFinite(audio.duration) ||
      audio.duration <= 0 ||
      audio.duration > 86400
    )
      fail("The upload must contain a supported audio recording.");
    let coverUrl = "";
    if (data.coverPublicId) {
      if (!data.coverPublicId.startsWith(`applemusic/images/${req.user._id}/`))
        fail("Cover ownership could not be verified.", 403);
      const image = await cloudinary.api.resource(data.coverPublicId, {
        resource_type: "image",
      });
      coverUrl = image.secure_url;
    }
    const artist = await Artist.findOneAndUpdate(
      { name: data.artistName },
      { $setOnInsert: { image: coverUrl } },
      { upsert: true, returnDocument: "after" },
    );
    const album = await Album.findOneAndUpdate(
      { title: data.albumTitle, artist: artist._id },
      { $setOnInsert: { coverUrl, year: data.releaseYear, genre: data.genre } },
      { upsert: true, returnDocument: "after" },
    );
    const song = await Song.create({
      ...data,
      artist: artist._id,
      albumId: album._id,
      audioUrl: audio.secure_url,
      coverUrl,
      duration: audio.duration,
      uploadedBy: req.user._id,
    });
    res.status(201).json(await song.populate(["artist", "albumId"]));
  }),
);
router.delete(
  "/:id",
  protect,
  wrap(async (req, res) => {
    const song = await Song.findOne({
      _id: id.parse(req.params.id),
      uploadedBy: req.user._id,
    });
    if (!song) fail("Uploaded track not found.", 404);
    await song.deleteOne();
    const Playlist = require("../models/Playlist"),
      User = require("../models/User");
    await Promise.all([
      Playlist.updateMany({ songs: song._id }, { $pull: { songs: song._id } }),
      User.updateMany(
        { favourites: song._id },
        { $pull: { favourites: song._id } },
      ),
    ]);
    res.json({ ok: true });
  }),
);
module.exports = router;
