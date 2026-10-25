const { z } = require("zod");
const id = z.string().regex(/^[a-f\d]{24}$/i, "Invalid record ID");
const fail = (message, status = 400) => {
  throw Object.assign(new Error(message), { status });
};
const wrap = (fn) => (req, res, next) =>
  Promise.resolve()
    .then(() => fn(req, res))
    .catch(next);
module.exports = { z, id, fail, wrap };
