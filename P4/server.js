const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors'); // Add CORS support if needed

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'products.json');
const PUBLIC_DIR = path.join(__dirname, 'public');

app.use(cors()); // Enable CORS for all origins (adjust if needed)
app.use(express.json());

// Helpers
async function readProducts() {
  try {
    const raw = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(raw || '[]');
  } catch (err) {
    if (err.code === 'ENOENT') return [];
    throw err;
  }
}

async function writeProducts(products) {
  await fs.writeFile(DATA_FILE, JSON.stringify(products, null, 2), 'utf8');
}

// API routes

app.get('/products', async (req, res) => {
  try {
    const products = await readProducts();
    res.json(products);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to load products.' });
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const product = products.find(p => String(p.id) === req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found.' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve product.' });
  }
});

app.post('/products', async (req, res) => {
  try {
    const { id, name, price } = req.body;
    if (!id || !name || price == null) {
      return res.status(400).json({ error: 'ID, name, and price required.' });
    }
    const products = await readProducts();
    if (products.some(p => String(p.id) === String(id))) {
      return res.status(409).json({ error: 'Product ID exists.' });
    }
    const newProduct = { id: String(id), name, price };
    products.push(newProduct);
    await writeProducts(products);
    res.status(201).json(newProduct);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add product.' });
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const idx = products.findIndex(p => String(p.id) === req.params.id);
    if (idx === -1) return res.status(404).json({ error: 'Product not found.' });
    const { name, price } = req.body;

    // Only update if fields are provided (allow clearing name or price? Your choice)
    if (name !== undefined) products[idx].name = name;
    if (price !== undefined) products[idx].price = price;

    await writeProducts(products);
    res.json(products[idx]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update product.' });
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const products = await readProducts();
    const filtered = products.filter(p => String(p.id) !== req.params.id);
    if (filtered.length === products.length) {
      return res.status(404).json({ error: 'Product not found.' });
    }
    await writeProducts(filtered);
    res.json({ message: 'Product deleted.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete product.' });
  }
});

// Serve static frontend files
app.use(express.static(PUBLIC_DIR));

// Fallback to index.html for SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'), (err) => {
    if (err) {
      console.error('Error sending index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

app.listen(PORT, () => console.log(`Server running -> http://localhost:${PORT}`));
