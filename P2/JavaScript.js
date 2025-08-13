// API Configuration
        const API_BASE_URL = 'http://localhost:3000/api';
        
        // Global variables
        let products = [];
        let editingProductId = null;
        let allCategories = new Set();

        // DOM Elements
        const productForm = document.getElementById('productForm');
        const editForm = document.getElementById('editForm');
        const editModal = document.getElementById('editModal');
        const productsContainer = document.getElementById('productsContainer');
        const messageArea = document.getElementById('messageArea');
        const loadingIndicator = document.getElementById('loadingIndicator');
        const filterCategory = document.getElementById('filterCategory');
        const minPriceFilter = document.getElementById('minPrice');
        const maxPriceFilter = document.getElementById('maxPrice');

        // Statistics elements
        const totalProductsEl = document.getElementById('totalProducts');
        const totalValueEl = document.getElementById('totalValue');
        const totalStockEl = document.getElementById('totalStock');

        // Initialize the app
        document.addEventListener('DOMContentLoaded', function() {
            loadProducts();
            setupEventListeners();
        });

        // Event Listeners
        function setupEventListeners() {
            productForm.addEventListener('submit', handleAddProduct);
            editForm.addEventListener('submit', handleEditProduct);
            
            // Modal controls
            document.getElementById('closeModal').addEventListener('click', closeModal);
            document.getElementById('cancelModal').addEventListener('click', closeModal);
            document.getElementById('cancelEdit').addEventListener('click', cancelEdit);
            
            // Filter controls
            filterCategory.addEventListener('change', applyFilters);
            minPriceFilter.addEventListener('input', debounce(applyFilters, 300));
            maxPriceFilter.addEventListener('input', debounce(applyFilters, 300));
            
            // Close modal when clicking outside
            editModal.addEventListener('click', function(e) {
                if (e.target === editModal) {
                    closeModal();
                }
            });
        }

        // API Functions
        async function apiCall(endpoint, options = {}) {
            try {
                const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    },
                    ...options
                });
                
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.message || `HTTP error! status: ${response.status}`);
                }
                
                return data;
            } catch (error) {
                console.error('API Error:', error);
                throw error;
            }
        }

        // Load Products
        async function loadProducts() {
            try {
                showLoading(true);
                const response = await apiCall('/products');
                products = response.data;
                updateCategories();
                displayProducts(products);
                updateStats(products);
                showMessage('Products loaded successfully!', 'success');
            } catch (error) {
                showMessage(`Error loading products: ${error.message}`, 'error');
                displayEmptyState();
            } finally {
                showLoading(false);
            }
        }

        // Add Product
        async function handleAddProduct(e) {
            e.preventDefault();
            
            const formData = new FormData(productForm);
            const productData = {
                name: document.getElementById('name').value,
                price: parseFloat(document.getElementById('price').value),
                category: document.getElementById('category').value,
                stock: parseInt(document.getElementById('stock').value)
            };

            try {
                const response = await apiCall('/products', {
                    method: 'POST',
                    body: JSON.stringify(productData)
                });
                
                showMessage(response.message, 'success');
                productForm.reset();
                loadProducts();
            } catch (error) {
                showMessage(`Error creating product: ${error.message}`, 'error');
            }
        }

        // Edit Product
        function editProduct(id) {
            const product = products.find(p => p.id === id);
            if (!product) return;

            editingProductId = id;
            
            document.getElementById('editName').value = product.name;
            document.getElementById('editPrice').value = product.price;
            document.getElementById('editCategory').value = product.category;
            document.getElementById('editStock').value = product.stock;
            
            editModal.style.display = 'block';
        }

        async function handleEditProduct(e) {
            e.preventDefault();
            
            const productData = {
                name: document.getElementById('editName').value,
                price: parseFloat(document.getElementById('editPrice').value),
                category: document.getElementById('editCategory').value,
                stock: parseInt(document.getElementById('editStock').value)
            };

            try {
                const response = await apiCall(`/products/${editingProductId}`, {
                    method: 'PUT',
                    body: JSON.stringify(productData)
                });
                
                showMessage(response.message, 'success');
                closeModal();
                loadProducts();
            } catch (error) {
                showMessage(`Error updating product: ${error.message}`, 'error');
            }
        }

        // Delete Product
        async function deleteProduct(id, name) {
            if (!confirm(`Are you sure you want to delete "${name}"?`)) {
                return;
            }

            try {
                const response = await apiCall(`/products/${id}`, {
                    method: 'DELETE'
                });
                
                showMessage(response.message, 'success');
                loadProducts();
            } catch (error) {
                showMessage(`Error deleting product: ${error.message}`, 'error');
            }
        }

        // Display Functions
        function displayProducts(productsToShow) {
            if (productsToShow.length === 0) {
                displayEmptyState();
                return;
            }

            const productsHTML = productsToShow.map(product => `
                <div class="product-card">
                    <div class="product-name">${escapeHtml(product.name)}</div>
                    <div class="product-info">
                        <span class="price">$${product.price.toFixed(2)}</span>
                        <span class="category">${escapeHtml(product.category)}</span>
                        <span class="stock">${product.stock} in stock</span>
                    </div>
                    <div class="product-actions">
                        <button class="btn btn-edit btn-small" onclick="editProduct(${product.id})">
                            ✏️ Edit
                        </button>
                        <button class="btn btn-secondary btn-small" onclick="deleteProduct(${product.id}, '${escapeHtml(product.name)}')">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `).join('');

            productsContainer.innerHTML = productsHTML;
        }

        function displayEmptyState() {
            productsContainer.innerHTML = `
                <div class="empty-state">
                    <div style="font-size: 4rem; margin-bottom: 20px;">📦</div>
                    <h3>No products found</h3>
                    <p>Add your first product using the form on the left</p>
                </div>
            `;
        }

        // Filter Products
        function applyFilters() {
            const categoryFilter = filterCategory.value.toLowerCase();
            const minPrice = parseFloat(minPriceFilter.value) || 0;
            const maxPrice = parseFloat(maxPriceFilter.value) || Infinity;

            const filteredProducts = products.filter(product => {
                const categoryMatch = !categoryFilter || product.category.toLowerCase().includes(categoryFilter);
                const priceMatch = product.price >= minPrice && product.price <= maxPrice;
                return categoryMatch && priceMatch;
            });

            displayProducts(filteredProducts);
            updateStats(filteredProducts);
        }

        // Update Categories Dropdown
        function updateCategories() {
            allCategories.clear();
            products.forEach(product => {
                allCategories.add(product.category);
            });

            const categoryOptions = Array.from(allCategories)
                .sort()
                .map(category => `<option value="${category}">${category}</option>`)
                .join('');

            filterCategory.innerHTML = '<option value="">All Categories</option>' + categoryOptions;
        }

        // Update Statistics
        function updateStats(productsToCount = products) {
            const totalProducts = productsToCount.length;
            const totalValue = productsToCount.reduce((sum, product) => sum + (product.price * product.stock), 0);
            const totalStock = productsToCount.reduce((sum, product) => sum + product.stock, 0);

            totalProductsEl.textContent = totalProducts;
            totalValueEl.textContent = `$${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            totalStockEl.textContent = totalStock.toLocaleString();
        }

        // Utility Functions
        function showMessage(message, type) {
            messageArea.innerHTML = `<div class="${type}">${message}</div>`;
            setTimeout(() => {
                messageArea.innerHTML = '';
            }, 5000);
        }

        function showLoading(show) {
            loadingIndicator.style.display = show ? 'block' : 'none';
        }

        function closeModal() {
            editModal.style.display = 'none';
            editingProductId = null;
        }

        function cancelEdit() {
            productForm.reset();
            editingProductId = null;
            document.getElementById('cancelEdit').style.display = 'none';
        }

        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }

        function debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }

        // Health Check (Optional - runs on page load)
        async function checkAPIHealth() {
            try {
                const response = await apiCall('/health');
                console.log('API Health:', response);
            } catch (error) {
                showMessage('Warning: Unable to connect to API. Make sure your server is running on localhost:3000', 'error');
            }
        }

        // Run health check when page loads
        checkAPIHealth();