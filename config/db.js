const mongoose = require('mongoose');

// Function to connect to the MongoDB database
const connectDB = async () => {
  try {
    // Read connection string from MONGO_URI (or MONGODB_URI fallback if set in cloud)
    const uri = process.env.MONGO_URI || process.env.MONGODB_URI;

    // Fail-fast if connection string is missing
    if (!uri) {
      console.error('MongoDB Connection Error: Neither MONGO_URI nor MONGODB_URI is defined in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    // Stop the application if database connection fails
    process.exit(1);
  }
};

module.exports = connectDB;
