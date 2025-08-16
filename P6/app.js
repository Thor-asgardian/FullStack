const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Sample data
let products = [
    {
        id: 1,
        name: "Laptop",
        price: 999.99,
        category: "Electronics",
        inStock: true,
        createdAt: new Date().toISOString()
    },
    {
        id: 2,
        name: "Coffee Mug",
        price: 12.99,
        category: "Kitchen",
        inStock: false,
        createdAt: new Date().toISOString()
    }
];
let nextId = 3;

// Health check
app.get('/health', (req, res) => {
    res.json({ success: true, message: 'API is running' });
});

// Get all products
app.get('/api/products', (req, res) => {
    let filtered = [...products];
    
    if (req.query.search) {
        const search = req.query.search.toLowerCase();
        filtered = filtered.filter(p => 
            p.name.toLowerCase().includes(search) ||
            p.category.toLowerCase().includes(search)
        );
    }
    
    if (req.query.category) {
        filtered = filtered.filter(p => 
            p.category.toLowerCase() === req.query.category.toLowerCase()
        );
    }
    
    if (req.query.inStock !== undefined) {
        const inStock = req.query.inStock === 'true';
        filtered = filtered.filter(p => p.inStock === inStock);
    }
    
    res.json({
        success: true,
        data: filtered,
        count: filtered.length
    });
});

// Get single product
app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    res.json({ success: true, data: product });
});

// Create product
app.post('/api/products', (req, res) => {
    const { name, price, category, inStock } = req.body;
    
    if (!name || !category || price === undefined || inStock === undefined) {
        return res.status(400).json({ 
            success: false, 
            error: 'Missing required fields' 
        });
    }
    
    const newProduct = {
        id: nextId++,
        name: name.trim(),
        price: parseFloat(price),
        category: category.trim(),
        inStock: Boolean(inStock),
        createdAt: new Date().toISOString()
    };
    
    products.push(newProduct);
    res.status(201).json({ success: true, data: newProduct });
});

// Update product
app.patch('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === parseInt(req.params.id));
    if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const { name, price, category, inStock } = req.body;
    
    if (name !== undefined) product.name = name.trim();
    if (price !== undefined) product.price = parseFloat(price);
    if (category !== undefined) product.category = category.trim();
    if (inStock !== undefined) product.inStock = Boolean(inStock);
    
    product.updatedAt = new Date().toISOString();
    
    res.json({ success: true, data: product });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
    const index = products.findIndex(p => p.id === parseInt(req.params.id));
    if (index === -1) {
        return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    const deleted = products.splice(index, 1)[0];
    res.json({ success: true, data: deleted });
});

// Serve frontend
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`📡 API: http://localhost:${PORT}/api/products`);
    console.log(`🌐 Frontend: http://localhost:${PORT}`);
});