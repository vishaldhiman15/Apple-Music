const router = require("express").Router();
const { Readable } = require("node:stream");
router.get("/{*path}", async (req, res, next) => {
  try {
    const { handleApi } = await import("../../worker/api.js");
    const request = new Request("http://" + req.get("host") + req.originalUrl, {
      headers: req.headers,
    });
    const result = await handleApi(request, {}, {});
    res.status(result.status);
    for (const [key, value] of result.headers) res.setHeader(key, value);
    if (result.body) Readable.fromWeb(result.body).pipe(res);
    else res.end();
  } catch (error) {
    next(error);
  }
});
module.exports = router;
