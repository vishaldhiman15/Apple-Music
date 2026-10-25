const router = require("express").Router(),
  mongoose = require("mongoose"),
  { id, wrap, fail } = require("../lib/http"),
  User = require("../models/User"),
  Song = require("../models/Song"),
  Album = require("../models/Album"),
  { protect } = require("../middlewares/authMiddleware");
router.use(protect);
router.put(
  "/favourites",
  wrap(async (req, res) => {
    const songId = id.parse(req.body.songId);
    if (!(await Song.exists({ _id: songId }))) fail("Track not found.", 404);
    const oid = new mongoose.Types.ObjectId(songId);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      [
        {
          $set: {
            favourites: {
              $cond: [
                { $in: [oid, { $ifNull: ["$favourites", []] }] },
                { $setDifference: ["$favourites", [oid]] },
                { $concatArrays: [{ $ifNull: ["$favourites", []] }, [oid]] },
              ],
            },
          },
        },
      ],
      { returnDocument: "after", updatePipeline: true },
    );
    res.json(user.favourites);
  }),
);
router.put(
  "/recently-played",
  wrap(async (req, res) => {
    const albumId = id.parse(req.body.albumId);
    if (!(await Album.exists({ _id: albumId }))) fail("Album not found.", 404);
    const oid = new mongoose.Types.ObjectId(albumId);
    const user = await User.findByIdAndUpdate(
      req.user._id,
      [
        {
          $set: {
            recentlyPlayed: {
              $slice: [
                {
                  $concatArrays: [
                    [oid],
                    {
                      $filter: {
                        input: { $ifNull: ["$recentlyPlayed", []] },
                        as: "a",
                        cond: { $ne: ["$$a", oid] },
                      },
                    },
                  ],
                },
                30,
              ],
            },
          },
        },
      ],
      { returnDocument: "after", updatePipeline: true },
    );
    res.json(user.recentlyPlayed);
  }),
);
module.exports = router;
