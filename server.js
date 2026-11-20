const express = require('express');
const dotenv = require('dotenv');
const connectDB = require('./config/db');
const productRoutes = require('./routes/productRoutes');
const errorHandler = require('./middleware/errorMiddleware');

// Load environment variables from .env file
dotenv.config();

// Connect to MongoDB Database
connectDB();

// Create an instance of Express application
const app = express();

// Middleware to automatically parse JSON in request bodies
app.use(express.json());

// Product routes
app.use('/api/products', productRoutes);

// Test route to verify the server is running
app.get('/', (req, res) => {
  res.send('Inventory and Data Management System API is running...');
});

// Centralized error handling middleware (must be registered after all routes)
app.use(errorHandler);

// Set the port from environment variable or default to 5000, and bind to 0.0.0.0 for cloud hosting
const PORT = process.env.PORT || 5000;
const HOST = '0.0.0.0';

// Start the Express server
app.listen(PORT, HOST, () => {
  console.log(`Server is running on port ${PORT}`);
});
