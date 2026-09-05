require('dotenv').config({ path: 'backend/.env' });
const mongoose = require('mongoose');

async function testConnection() {
  try {
    console.log('URI:', process.env.MONGODB_URI);
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('SUCCESS: Connected to MongoDB');
    process.exit(0);
  } catch (err) {
    console.error('ERROR:', err.message);
    process.exit(1);
  }
}

testConnection();
