const mongoose = require('mongoose');

// Define the Product Schema with validation rules
const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      required: [true, 'Product category is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'Product SKU is required'],
      unique: true,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Product price is required'],
      min: [0, 'Price must be 0 or greater'],
    },
    quantity: {
      type: Number,
      required: [true, 'Product quantity is required'],
      min: [0, 'Quantity must be 0 or greater'],
    },
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: [0, 'Low stock threshold must be 0 or greater'],
    },
  },
  {
    // Enable automatic createdAt and updatedAt timestamps
    timestamps: true,
  }
);

// Create and export the Product model
const Product = mongoose.model('Product', productSchema);

module.exports = Product;
