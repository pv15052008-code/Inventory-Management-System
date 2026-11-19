const mongoose = require('mongoose');
const Product = require('../models/Product');

// 1. Create a new product
// POST /api/products
const createProduct = async (req, res, next) => {
  try {
    const { name, description, category, sku, price, quantity, lowStockThreshold } = req.body;

    // Create a new product document from the request body
    const newProduct = new Product({
      name,
      description,
      category,
      sku,
      price,
      quantity,
      lowStockThreshold,
    });

    // Save to MongoDB
    const savedProduct = await newProduct.save();

    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: savedProduct,
    });
  } catch (error) {
    // Handle duplicate SKU error (MongoDB error code 11000)
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SKU: A product with this SKU already exists.',
      });
    }

    // Handle Mongoose validation errors (e.g., missing required fields)
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 2. Get all products with Filtering, Sorting, and Pagination
// GET /api/products
const getAllProducts = async (req, res, next) => {
  try {
    const {
      category,
      name,
      minPrice,
      maxPrice,
      quantity,
      minQuantity,
      maxQuantity,
      sortBy,
      order,
      page,
      limit,
    } = req.query;

    // ---------------------------------------------------------
    // 1. INPUT VALIDATION
    // ---------------------------------------------------------

    // 1. Sort field validation (only allow name, price, quantity)
    if (sortBy) {
      const allowedSortFields = ['name', 'price', 'quantity'];
      if (!allowedSortFields.includes(sortBy)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid sortBy field. Allowed fields are: name, price, quantity.',
        });
      }
    }

    // 2. Sort order validation (only allow asc, desc)
    if (order) {
      const allowedOrders = ['asc', 'desc'];
      if (!allowedOrders.includes(order)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid order. Allowed values are: asc, desc.',
        });
      }
    }

    // 3. Numeric validation for minPrice
    if (minPrice !== undefined) {
      const numMinPrice = Number(minPrice);
      if (isNaN(numMinPrice) || numMinPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'minPrice must be a valid non-negative number.',
        });
      }
    }

    // 4. Numeric validation for maxPrice
    if (maxPrice !== undefined) {
      const numMaxPrice = Number(maxPrice);
      if (isNaN(numMaxPrice) || numMaxPrice < 0) {
        return res.status(400).json({
          success: false,
          message: 'maxPrice must be a valid non-negative number.',
        });
      }
    }

    // 5. Range validation for price (minPrice <= maxPrice)
    if (minPrice !== undefined && maxPrice !== undefined) {
      if (Number(minPrice) > Number(maxPrice)) {
        return res.status(400).json({
          success: false,
          message: 'minPrice cannot be greater than maxPrice.',
        });
      }
    }

    // 6. Numeric validation for quantity
    if (quantity !== undefined) {
      const numQuantity = Number(quantity);
      if (isNaN(numQuantity) || numQuantity < 0) {
        return res.status(400).json({
          success: false,
          message: 'quantity must be a valid non-negative number.',
        });
      }
    }

    // 7. Numeric validation for minQuantity
    if (minQuantity !== undefined) {
      const numMinQty = Number(minQuantity);
      if (isNaN(numMinQty) || numMinQty < 0) {
        return res.status(400).json({
          success: false,
          message: 'minQuantity must be a valid non-negative number.',
        });
      }
    }

    // 8. Numeric validation for maxQuantity
    if (maxQuantity !== undefined) {
      const numMaxQty = Number(maxQuantity);
      if (isNaN(numMaxQty) || numMaxQty < 0) {
        return res.status(400).json({
          success: false,
          message: 'maxQuantity must be a valid non-negative number.',
        });
      }
    }

    // 9. Range validation for quantity (minQuantity <= maxQuantity)
    if (minQuantity !== undefined && maxQuantity !== undefined) {
      if (Number(minQuantity) > Number(maxQuantity)) {
        return res.status(400).json({
          success: false,
          message: 'minQuantity cannot be greater than maxQuantity.',
        });
      }
    }

    // 10. Numeric validation for page (must be a positive integer)
    if (page !== undefined) {
      const numPage = Number(page);
      if (isNaN(numPage) || !Number.isInteger(numPage) || numPage <= 0) {
        return res.status(400).json({
          success: false,
          message: 'page must be a positive integer greater than 0.',
        });
      }
    }

    // 11. Numeric validation for limit (must be a positive integer)
    if (limit !== undefined) {
      const numLimit = Number(limit);
      if (isNaN(numLimit) || !Number.isInteger(numLimit) || numLimit <= 0) {
        return res.status(400).json({
          success: false,
          message: 'limit must be a positive integer greater than 0.',
        });
      }
    }

    // ---------------------------------------------------------
    // 2. FILTERING
    // ---------------------------------------------------------
    const query = {};

    // Filter by Category (case-insensitive)
    if (category) {
      query.category = { $regex: category, $options: 'i' };
    }

    // Filter by Product Name (case-insensitive partial search)
    if (name) {
      query.name = { $regex: name, $options: 'i' };
    }

    // Filter by Price range (minPrice and maxPrice)
    if (minPrice !== undefined || maxPrice !== undefined) {
      query.price = {};
      if (minPrice !== undefined) {
        query.price.$gte = Number(minPrice);
      }
      if (maxPrice !== undefined) {
        query.price.$lte = Number(maxPrice);
      }
    }

    // Filter by Stock Quantity (exact quantity, or minQuantity / maxQuantity range)
    if (quantity !== undefined) {
      query.quantity = Number(quantity);
    } else if (minQuantity !== undefined || maxQuantity !== undefined) {
      query.quantity = {};
      if (minQuantity !== undefined) {
        query.quantity.$gte = Number(minQuantity);
      }
      if (maxQuantity !== undefined) {
        query.quantity.$lte = Number(maxQuantity);
      }
    }

    // ---------------------------------------------------------
    // 3. SORTING
    // ---------------------------------------------------------
    let sort = {};
    if (sortBy) {
      // 'desc' = -1 (descending), default / 'asc' = 1 (ascending)
      const sortOrder = order === 'desc' ? -1 : 1;
      sort[sortBy] = sortOrder;
    } else {
      // Default: sort newest products first
      sort.createdAt = -1;
    }

    // ---------------------------------------------------------
    // 4. PAGINATION
    // ---------------------------------------------------------
    // Default page = 1, default limit = 10
    const pageNum = page !== undefined ? Number(page) : 1;
    const limitNum = limit !== undefined ? Number(limit) : 10;

    // Calculate how many documents to skip
    const skip = (pageNum - 1) * limitNum;

    // Count total matching documents in MongoDB
    const totalProducts = await Product.countDocuments(query);

    // Calculate total pages
    const totalPages = Math.ceil(totalProducts / limitNum) || 1;

    // Fetch the paginated and sorted products
    const products = await Product.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limitNum);

    // Return the response
    res.status(200).json({
      success: true,
      totalProducts,
      currentPage: pageNum,
      totalPages,
      limit: limitNum,
      count: products.length,
      data: products,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 3. Get a single product by ID
// GET /api/products/:id
const getProductById = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Find product by its ID
    const product = await Product.findById(id);

    // If product does not exist
    if (!product) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 4. Update product details by ID
// PUT /api/products/:id
const updateProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Find and update the product
    // new: true returns the updated document
    // runValidators: true ensures schema validation rules are applied to updates
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    );

    // If product does not exist
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct,
    });
  } catch (error) {
    // Handle duplicate SKU error if user tries to update SKU to an existing one
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: 'Duplicate SKU: A product with this SKU already exists.',
      });
    }

    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 5. Delete a product by ID
// DELETE /api/products/:id
const deleteProduct = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Check if the provided ID is a valid MongoDB ObjectId
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Find and delete the product
    const deletedProduct = await Product.findByIdAndDelete(id);

    // If product does not exist
    if (!deletedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 6. Restock product (Increase stock)
// POST /api/products/:id/restock
const restockProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Validate product ID format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Validate restock amount (must be a positive integer)
    const numAmount = Number(amount);
    if (amount === undefined || isNaN(numAmount) || !Number.isInteger(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Restock amount must be a positive integer greater than 0',
      });
    }

    // Atomically increase quantity using $inc
    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { $inc: { quantity: numAmount } },
      { new: true, runValidators: true }
    );

    // If product does not exist
    if (!updatedProduct) {
      return res.status(404).json({
        success: false,
        message: 'Product not found',
      });
    }

    res.status(200).json({
      success: true,
      message: `Product restocked successfully by ${numAmount} units`,
      data: updatedProduct,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 7. Sell product (Decrease stock safely)
// POST /api/products/:id/sale
const sellProduct = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { amount } = req.body;

    // Validate product ID format
    if (!mongoose.isValidObjectId(id)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid product ID format',
      });
    }

    // Validate sale amount (must be a positive integer)
    const numAmount = Number(amount);
    if (amount === undefined || isNaN(numAmount) || !Number.isInteger(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Sale amount must be a positive integer greater than 0',
      });
    }

    // Safe Atomic Update:
    // Only update if quantity >= numAmount so simultaneous sales cannot make stock negative
    const updatedProduct = await Product.findOneAndUpdate(
      { _id: id, quantity: { $gte: numAmount } },
      { $inc: { quantity: -numAmount } },
      { new: true }
    );

    // If no document was updated, determine if product does not exist or stock is insufficient
    if (!updatedProduct) {
      const product = await Product.findById(id);

      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Product not found',
        });
      }

      return res.status(400).json({
        success: false,
        message: `Insufficient stock. Current stock is ${product.quantity}, but requested sale amount is ${numAmount}`,
      });
    }

    res.status(200).json({
      success: true,
      message: `Sold ${numAmount} units successfully`,
      data: updatedProduct,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 8. Low-Stock Alert Report
// GET /api/products/low-stock
const getLowStockProducts = async (req, res, next) => {
  try {
    // Find products where quantity <= lowStockThreshold using MongoDB $expr
    const lowStockProducts = await Product.find({
      $expr: { $lte: ['$quantity', '$lowStockThreshold'] },
    });

    res.status(200).json({
      success: true,
      message: 'Low-stock products fetched successfully',
      count: lowStockProducts.length,
      data: lowStockProducts,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

// 9. Category-wise Inventory Summary (MongoDB Aggregation)
// GET /api/products/category-summary
const getCategorySummary = async (req, res, next) => {
  try {
    // Aggregation pipeline to group by category and calculate statistics
    const summary = await Product.aggregate([
      {
        // Group by category
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          totalQuantity: { $sum: '$quantity' },
          totalStockValue: { $sum: { $multiply: ['$price', '$quantity'] } },
          averagePrice: { $avg: '$price' },
        },
      },
      {
        // Format the output structure nicely
        $project: {
          _id: 0,
          category: '$_id',
          totalProducts: 1,
          totalQuantity: 1,
          totalStockValue: { $round: ['$totalStockValue', 2] },
          averagePrice: { $round: ['$averagePrice', 2] },
        },
      },
      {
        // Sort categories alphabetically
        $sort: { category: 1 },
      },
    ]);

    res.status(200).json({
      success: true,
      message: 'Category-wise inventory summary fetched successfully',
      count: summary.length,
      data: summary,
    });
  } catch (error) {
    // Forward unexpected errors to the centralized error middleware
    next(error);
  }
};

module.exports = {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  restockProduct,
  sellProduct,
  getLowStockProducts,
  getCategorySummary,
};
