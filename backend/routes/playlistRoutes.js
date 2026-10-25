const router = require("express").Router(),
  { z, id, wrap, fail } = require("../lib/http"),
  Playlist = require("../models/Playlist"),
  Song = require("../models/Song"),
  { protect } = require("../middlewares/authMiddleware");
router.use(protect);
const fields = {
  name: z.string().trim().min(1).max(80),
  description: z.string().max(500).default(""),
};
const own = async (req) => {
  const record = await Playlist.findOne({
    _id: id.parse(req.params.id),
    user: req.user._id,
  });
  if (!record) fail("Playlist not found.", 404);
  return record;
};
router.get(
  "/",
  wrap(async (req, res) =>
    res.json(
      await Playlist.find({ user: req.user._id }).sort({ createdAt: 1 }),
    ),
  ),
);
router.post(
  "/",
  wrap(async (req, res) => {
    const data = z.object(fields).parse(req.body);
    res
      .status(201)
      .json(await Playlist.create({ ...data, user: req.user._id, songs: [] }));
  }),
);
router.get(
  "/:id",
  wrap(async (req, res) => res.json(await own(req))),
);
router.patch(
  "/:id",
  wrap(async (req, res) => {
    const p = await own(req);
    const data = z
      .object({
        ...fields,
        description: z.string().max(500),
        songs: z.array(id).max(1000),
      })
      .partial()
      .parse(req.body);
    if (data.songs) {
      data.songs = [...new Set(data.songs)];
      if (
        (await Song.countDocuments({ _id: { $in: data.songs } })) !==
        data.songs.length
      )
        fail("One or more tracks are unavailable.", 404);
    }
    Object.assign(p, data);
    await p.save();
    res.json(p);
  }),
);
router.put(
  "/:id/add-song",
  wrap(async (req, res) => {
    const p = await own(req),
      songId = id.parse(req.body.songId);
    if (!(await Song.exists({ _id: songId }))) fail("Track not found.", 404);
    if (!p.songs.some((s) => String(s) === songId)) {
      if (p.songs.length >= 1000) fail("Playlists support up to 1,000 tracks.");
      p.songs.push(songId);
      await p.save();
    }
    res.json(p);
  }),
);
router.delete(
  "/:id",
  wrap(async (req, res) => {
    const p = await own(req);
    await p.deleteOne();
    res.json({ ok: true });
  }),
);
module.exports = router;
