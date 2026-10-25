require("./env");
const cloudinary = require("cloudinary").v2;
const options = { secure: true };
for (const [key, name] of Object.entries({
  cloud_name: "CLOUDINARY_CLOUD_NAME",
  api_key: "CLOUDINARY_API_KEY",
  api_secret: "CLOUDINARY_API_SECRET",
})) {
  if (process.env[name]?.trim()) options[key] = process.env[name].trim();
}
cloudinary.config(options);
const configured = () => {
  const { cloud_name, api_key, api_secret } = cloudinary.config();
  return Boolean(cloud_name && api_key && api_secret);
};
module.exports = { cloudinary, configured };
