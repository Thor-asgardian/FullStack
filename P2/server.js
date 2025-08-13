const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware to parse JSON bodies
// Middleware to parse JSON bodies
app.use(express.json());

// ADD THIS CORS MIDDLEWARE:
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
  } else {
    next();
  }
});

// In-memory storage for products (replace with database in production)
let products = [
  { id: 1, name: 'Laptop', price: 999.99, category: 'Electronics', stock: 50 },
  { id: 2, name: 'Coffee Mug', price: 12.99, category: 'Kitchen', stock: 100 },
  { id: 3, name: 'Notebook', price: 5.99, category: 'Stationery', stock: 200 }
];

// Counter for generating new IDs
let nextId = 4;

// Helper function to find product by ID
const findProductById = (id) => {
  return products.find(product => product.id === parseInt(id));
};

// Helper function to validate product data
const validateProduct = (product) => {
  const errors = [];
  
  if (!product.name || product.name.trim() === '') {
    errors.push('Name is required');
  }
  
  if (product.price === undefined || product.price === null || product.price < 0) {
    errors.push('Price is required and must be non-negative');
  }
  
  if (!product.category || product.category.trim() === '') {
    errors.push('Category is required');
  }
  
  if (product.stock === undefined || product.stock === null || product.stock < 0) {
    errors.push('Stock is required and must be non-negative');
  }
  
  return errors;
};

// Routes

// GET /api/products - Get all products
app.get('/api/products', (req, res) => {
  try {
    // Optional query parameters for filtering
    const { category, minPrice, maxPrice } = req.query;
    let filteredProducts = [...products];
    
    if (category) {
      filteredProducts = filteredProducts.filter(p => 
        p.category.toLowerCase().includes(category.toLowerCase())
      );
    }
    
    if (minPrice) {
      filteredProducts = filteredProducts.filter(p => p.price >= parseFloat(minPrice));
    }
    
    if (maxPrice) {
      filteredProducts = filteredProducts.filter(p => p.price <= parseFloat(maxPrice));
    }
    
    res.status(200).json({
      success: true,
      count: filteredProducts.length,
      data: filteredProducts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching products',
      error: error.message
    });
  }
});

// GET /api/products/:id - Get a single product by ID
app.get('/api/products/:id', (req, res) => {
  try {
    const product = findProductById(req.params.id);
    
    if (!product) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${req.params.id} not found`
      });
    }
    
    res.status(200).json({
      success: true,
      data: product
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while fetching product',
      error: error.message
    });
  }
});

// POST /api/products - Create a new product
app.post('/api/products', (req, res) => {
  try {
    const { name, price, category, stock } = req.body;
    
    // Validate input
    const validationErrors = validateProduct(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check if product with same name already exists
    const existingProduct = products.find(p => 
      p.name.toLowerCase() === name.toLowerCase()
    );
    
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Product with this name already exists'
      });
    }
    
    // Create new product
    const newProduct = {
      id: nextId++,
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock: parseInt(stock),
      createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    
    res.status(201).json({
      success: true,
      message: 'Product created successfully',
      data: newProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while creating product',
      error: error.message
    });
  }
});

// PUT /api/products/:id - Update a product
app.put('/api/products/:id', (req, res) => {
  try {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${req.params.id} not found`
      });
    }
    
    // Validate input
    const validationErrors = validateProduct(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    const { name, price, category, stock } = req.body;
    
    // Check if another product with same name exists (excluding current product)
    const existingProduct = products.find(p => 
      p.name.toLowerCase() === name.toLowerCase() && p.id !== parseInt(req.params.id)
    );
    
    if (existingProduct) {
      return res.status(409).json({
        success: false,
        message: 'Another product with this name already exists'
      });
    }
    
    // Update product
    const updatedProduct = {
      ...products[productIndex],
      name: name.trim(),
      price: parseFloat(price),
      category: category.trim(),
      stock: parseInt(stock),
      updatedAt: new Date().toISOString()
    };
    
    products[productIndex] = updatedProduct;
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating product',
      error: error.message
    });
  }
});

// PATCH /api/products/:id - Partially update a product
app.patch('/api/products/:id', (req, res) => {
  try {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${req.params.id} not found`
      });
    }
    
    const allowedFields = ['name', 'price', 'category', 'stock'];
    const updates = {};
    
    // Only include allowed fields that are present in request
    Object.keys(req.body).forEach(key => {
      if (allowedFields.includes(key) && req.body[key] !== undefined) {
        updates[key] = req.body[key];
      }
    });
    
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No valid fields to update'
      });
    }
    
    // Validate only the fields being updated
    const tempProduct = { ...products[productIndex], ...updates };
    const validationErrors = validateProduct(tempProduct);
    
    if (validationErrors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: validationErrors
      });
    }
    
    // Check name uniqueness if name is being updated
    if (updates.name) {
      const existingProduct = products.find(p => 
        p.name.toLowerCase() === updates.name.toLowerCase() && p.id !== parseInt(req.params.id)
      );
      
      if (existingProduct) {
        return res.status(409).json({
          success: false,
          message: 'Another product with this name already exists'
        });
      }
      updates.name = updates.name.trim();
    }
    
    // Apply type conversions
    if (updates.price !== undefined) updates.price = parseFloat(updates.price);
    if (updates.stock !== undefined) updates.stock = parseInt(updates.stock);
    if (updates.category !== undefined) updates.category = updates.category.trim();
    
    // Update product
    const updatedProduct = {
      ...products[productIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    products[productIndex] = updatedProduct;
    
    res.status(200).json({
      success: true,
      message: 'Product updated successfully',
      data: updatedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while updating product',
      error: error.message
    });
  }
});

// DELETE /api/products/:id - Delete a product
app.delete('/api/products/:id', (req, res) => {
  try {
    const productIndex = products.findIndex(p => p.id === parseInt(req.params.id));
    
    if (productIndex === -1) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${req.params.id} not found`
      });
    }
    
    const deletedProduct = products.splice(productIndex, 1)[0];
    
    res.status(200).json({
      success: true,
      message: 'Product deleted successfully',
      data: deletedProduct
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server error occurred while deleting product',
      error: error.message
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running successfully',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Catch-all for undefined routes
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API endpoints available at http://localhost:${PORT}/api`);
  console.log(`🔍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = app;