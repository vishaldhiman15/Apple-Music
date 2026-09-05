const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: async (req, file) => {
    // Determine folder and resource_type based on mimetype
    let folder = 'applemusic/others';
    let resource_type = 'auto';

    if (file.mimetype.startsWith('image/')) {
      folder = 'applemusic/images';
      resource_type = 'image';
    } else if (file.mimetype.startsWith('audio/')) {
      folder = 'applemusic/audio';
      resource_type = 'video'; // Cloudinary treats audio as video for some formats, auto handles this usually
    }

    return {
      folder: folder,
      resource_type: resource_type,
      allowed_formats: ['jpg', 'png', 'jpeg', 'mp3', 'wav', 'm4a']
    };
  }
});

const upload = multer({ storage: storage });

module.exports = { cloudinary, upload };
