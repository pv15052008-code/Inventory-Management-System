# Inventory and Data Management System

A beginner-friendly RESTful backend API built with **Node.js**, **Express.js**, **MongoDB**, and **Mongoose** to manage store and warehouse inventory.

---

## 🌐 Live Deployment

The application is deployed on **Render** and connected to **MongoDB Atlas**:

- **Live API**: https://inventory-management-system-ldfk.onrender.com
- **Products API**: https://inventory-management-system-ldfk.onrender.com/api/products
- **Category Summary API**: https://inventory-management-system-ldfk.onrender.com/api/products/category-summary
- **GitHub Repository**: https://github.com/pv15052008-code/Inventory-Management-System

---

## 🚀 Technology Stack

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **ODM**: Mongoose
- **Configuration**: dotenv

---

## 📁 Project Structure

```text
Inventory-Management-System/
├── config/
│   └── db.js                  # MongoDB Mongoose connection
├── controllers/
│   └── productController.js   # API logic (CRUD, filtering, sorting, pagination, reports)
├── middleware/
│   └── errorMiddleware.js     # Centralized error handling middleware
├── models/
│   └── Product.js             # Mongoose schema and model definition
├── routes/
│   └── productRoutes.js       # Express routes mapping
├── .env.example               # Example environment configuration
├── .gitignore                 # Files excluded from version control
├── package.json               # Project metadata & dependencies
└── server.js                  # Application entry point
```

---

## ⚙️ Installation & Setup

1. **Clone the repository**:
   ```bash
   git clone https://github.com/pv15052008-code/Inventory-Management-System.git
   cd Inventory-Management-System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Configure Environment Variables**:
   Create a `.env` file in the root directory (or copy from `.env.example`):
   ```env
   PORT=5000
   MONGO_URI=mongodb://127.0.0.1:27017/inventory_db
   ```

4. **Start the server**:
   ```bash
   node server.js
   # or
   npm start
   ```
   The server will start at `http://localhost:5000`.

---

## 📋 API Endpoints

### 1. Health Check
- **`GET /`** &mdash; Verify the server is running.

### 2. Product CRUD Operations
- **`POST /api/products`** &mdash; Create a new product.
  - **Body** (JSON):
    ```json
    {
      "name": "Wireless Mouse",
      "description": "2.4GHz optical mouse",
      "category": "Electronics",
      "sku": "ELEC-MOU-001",
      "price": 25.99,
      "quantity": 50,
      "lowStockThreshold": 10
    }
    ```
- **`GET /api/products`** &mdash; Get all products (supports filtering, sorting, and pagination).
- **`GET /api/products/:id`** &mdash; Get a single product by its MongoDB ObjectId.
- **`PUT /api/products/:id`** &mdash; Update an existing product by ID.
- **`DELETE /api/products/:id`** &mdash; Delete a product by ID.

### 3. Filtering, Sorting & Pagination
- **Category Filter**: `GET /api/products?category=Electronics`
- **Name Search**: `GET /api/products?name=mouse`
- **Price Range**: `GET /api/products?minPrice=20&maxPrice=100`
- **Quantity Filter**: `GET /api/products?minQuantity=10&maxQuantity=50`
- **Sorting**: `GET /api/products?sortBy=price&order=asc` *(allowed fields: `name`, `price`, `quantity`)*
- **Pagination**: `GET /api/products?page=1&limit=5`
- **Combined**: `GET /api/products?category=Electronics&sortBy=price&order=desc&page=1&limit=5`

### 4. Stock Adjustments
- **`POST /api/products/:id/restock`** (or `PATCH`) &mdash; Increase stock atomically.
  - **Body**: `{ "amount": 10 }`
- **`POST /api/products/:id/sale`** (or `PATCH`) &mdash; Decrease stock atomically.
  - **Body**: `{ "amount": 5 }`
  - *Prevents stock from becoming negative; returns 400 if stock is insufficient.*

### 5. Inventory Reports
- **`GET /api/products/low-stock`** &mdash; Retrieve products where `quantity <= lowStockThreshold`.
- **`GET /api/products/category-summary`** &mdash; MongoDB aggregation pipeline returning:
  - Total number of products per category.
  - Total quantity in stock per category.
  - Total inventory stock value (`price * quantity`).
  - Average product price per category.

---

## 🛡️ Error Handling

- **`400 Bad Request`**: Returned for invalid ObjectId format, missing required fields, duplicate SKU (MongoDB error code 11000), negative numbers, and invalid query parameters.
- **`404 Not Found`**: Returned when querying, updating, or deleting a non-existent product ID.
- **`500 Internal Server Error`**: Managed centrally by `middleware/errorMiddleware.js`. Technical stack traces are hidden in production mode (`NODE_ENV=production`).
