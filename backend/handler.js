// Vercel keeps this module warm; share one MongoDB connection across requests.
const { app, connect } = require("./server");
let ready;
module.exports = async (req, res) => {
  try {
    if (!ready)
      ready = connect().catch((error) => {
        ready = undefined;
        throw error;
      });
    await ready;
    return app(req, res);
  } catch (error) {
    console.error("Account server unavailable:", error.name);
    return res
      .status(503)
      .json({
        message:
          "Account sync is unavailable. Your device library still works.",
      });
  }
};
