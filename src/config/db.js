require('dotenv').config();
const mongoose = require('mongoose');
const mongodbConnectionString = process.env.MONGODB_URI
const connectDB = async () => {
  if (!mongodbConnectionString) {
    console.error("❌ Error: MONGODB_URI is not defined in environment variables.");
    process.exit(1);
  }
  
  try {
    const conn = await mongoose.connect(mongodbConnectionString);
    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    process.exit(1);
  }
};
module.exports = connectDB;