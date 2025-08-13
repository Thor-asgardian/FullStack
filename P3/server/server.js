// server.js
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json()); // Parse JSON bodies

// Fake in-memory database
let products = [
  { id: 1, name: 'Laptop', price: 800 },
  { id: 2, name: 'Phone', price: 500 },
  { id: 3, name: 'Headphones', price: 100 }
];

// ==================== ROUTES ====================

// GET all products
app.get('/products', (req, res) => {
  res.json(products);
});

// GET single product by ID
app.get('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const product = products.find(p => p.id === id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }
  res.json(product);
});

// POST create a new product
app.post('/products', (req, res) => {
  const { name, price } = req.body;

  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  const newProduct = {
    id: products.length ? products[products.length - 1].id + 1 : 1,
    name,
    price
  };
  products.push(newProduct);
  res.status(201).json(newProduct);
});

// PUT update a product
app.put('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const { name, price } = req.body;
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  if (!name || typeof price !== 'number') {
    return res.status(400).json({ error: 'Invalid product data' });
  }

  products[index] = { id, name, price };
  res.json(products[index]);
});

// DELETE remove a product
app.delete('/products/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const index = products.findIndex(p => p.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const deleted = products.splice(index, 1);
  res.json({ message: 'Product deleted', deleted: deleted[0] });
});

// Handle unknown routes — always return JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Not Found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
