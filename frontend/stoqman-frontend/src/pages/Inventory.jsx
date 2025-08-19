import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  MagnifyingGlassIcon, 
  FunnelIcon,
  EyeIcon,
  PencilIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  ChevronDownIcon,
  TagIcon,
  CubeIcon,
  AdjustmentsHorizontalIcon,
  ArrowDownTrayIcon,
  PhotoIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ExclamationCircleIcon,
  InformationCircleIcon
} from '@heroicons/react/24/solid';
import { productAPI, categoryAPI } from '../services/api';
import Button from '../components/ui/Button';
import ProductModal from '../components/inventory/ProductModal';
import CategoryModal from '../components/inventory/CategoryModal';
import ProductViewModal from '../components/inventory/ProductViewModal';
import BulkActionsModal from '../components/inventory/BulkActionsModal';

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [stockFilter, setStockFilter] = useState(''); // all, in_stock, low_stock, out_of_stock
  const [sortBy, setSortBy] = useState('name'); // name, stock, price, created_at
  const [sortOrder, setSortOrder] = useState('asc'); // asc, desc
  
  // Modal states
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // View mode
  const [viewMode, setViewMode] = useState('table'); // table, grid

  // Stats
  const [stats, setStats] = useState({
    totalProducts: 0,
    totalValue: 0,
    lowStockCount: 0,
    outOfStockCount: 0
  });

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    filterAndSortProducts();
  }, [products, searchTerm, selectedCategory, stockFilter, sortBy, sortOrder]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [productsRes, categoriesRes] = await Promise.all([
        productAPI.getAll(),
        categoryAPI.getAll()
      ]);
      
      const productsData = productsRes.data.results || productsRes.data || [];
      const categoriesData = categoriesRes.data.results || categoriesRes.data || [];
      
      setProducts(productsData);
      setCategories(categoriesData);
      
      // Calculate stats
      calculateStats(productsData);
      
    } catch (error) {
      console.error('Error fetching data:', error);
      setError('Failed to load inventory data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (productsData) => {
    const totalProducts = productsData.length;
    const totalValue = productsData.reduce((sum, product) => 
      sum + (parseFloat(product.price || 0) * parseInt(product.stock_quantity || 0)), 0
    );
    const lowStockCount = productsData.filter(p => p.is_low_stock).length;
    const outOfStockCount = productsData.filter(p => parseInt(p.stock_quantity || 0) === 0).length;
    
    setStats({
      totalProducts,
      totalValue,
      lowStockCount,
      outOfStockCount
    });
  };

  const filterAndSortProducts = () => {
    let filtered = [...products];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Category filter
    if (selectedCategory) {
      filtered = filtered.filter(product => product.category === parseInt(selectedCategory));
    }

    // Stock filter
    if (stockFilter) {
      switch (stockFilter) {
        case 'in_stock':
          filtered = filtered.filter(product => parseInt(product.stock_quantity || 0) > 0 && !product.is_low_stock);
          break;
        case 'low_stock':
          filtered = filtered.filter(product => product.is_low_stock);
          break;
        case 'out_of_stock':
          filtered = filtered.filter(product => parseInt(product.stock_quantity || 0) === 0);
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortBy) {
        case 'name':
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
          break;
        case 'stock':
          aValue = parseInt(a.stock_quantity || 0);
          bValue = parseInt(b.stock_quantity || 0);
          break;
        case 'price':
          aValue = parseFloat(a.price || 0);
          bValue = parseFloat(b.price || 0);
          break;
        case 'created_at':
          aValue = new Date(a.created_at);
          bValue = new Date(b.created_at);
          break;
        default:
          aValue = a.name.toLowerCase();
          bValue = b.name.toLowerCase();
      }

      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredProducts(filtered);
  };

  const handleAddProduct = () => {
    setSelectedProduct(null);
    setShowProductModal(true);
  };

  const handleEditProduct = (product) => {
    setSelectedProduct(product);
    setShowProductModal(true);
  };

  const handleViewProduct = (product) => {
    setSelectedProduct(product);
    setShowViewModal(true);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      try {
        await productAPI.delete(productId);
        setSuccess('Product deleted successfully');
        fetchData();
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting product:', error);
        setError('Failed to delete product. Please try again.');
        setTimeout(() => setError(''), 3000);
      }
    }
  };

  const handleBulkAction = (action) => {
    if (selectedProducts.length === 0) {
      setError('Please select products to perform bulk actions');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setShowBulkModal(true);
  };

  const handleProductSelect = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const handleSelectAll = () => {
    if (selectedProducts.length === filteredProducts.length) {
      setSelectedProducts([]);
    } else {
      setSelectedProducts(filteredProducts.map(p => p.id));
    }
  };

  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const getStockStatus = (product) => {
    const quantity = parseInt(product.stock_quantity || 0);
    if (quantity === 0) {
      return { status: 'out_of_stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (product.is_low_stock) {
      return { status: 'low_stock', label: 'Low Stock', color: 'bg-yellow-100 text-yellow-800' };
    } else {
      return { status: 'in_stock', label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedCategory('');
    setStockFilter('');
    setSortBy('name');
    setSortOrder('asc');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Inventory</h2>
          <p className="text-gray-500">Fetching your products...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Inventory Management</h1>
              <p className="text-gray-600">Manage your products, stock levels, and categories</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
              <Button 
                variant="outline" 
                onClick={() => setShowCategoryModal(true)}
                className="flex items-center space-x-2"
              >
                <TagIcon className="w-4 h-4" />
                <span>Manage Categories</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => handleBulkAction('export')}
                className="flex items-center space-x-2"
              >
                <ArrowDownTrayIcon className="w-4 h-4" />
                <span>Export</span>
              </Button>
              
              <Button 
                onClick={handleAddProduct}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Product</span>
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
              <CheckCircleIcon className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-green-700">{success}</span>
            </div>
          )}
          
          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Products</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CubeIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Value</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalValue)}</p>
              </div>
              <div className="p-3 bg-blue-100 rounded-xl">
                <TagIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Low Stock</p>
                <p className="text-2xl font-bold text-yellow-600">{stats.lowStockCount}</p>
              </div>
              <div className="p-3 bg-yellow-100 rounded-xl">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Out of Stock</p>
                <p className="text-2xl font-bold text-red-600">{stats.outOfStockCount}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ExclamationCircleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products, SKU, description..."
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            {/* Category Filter */}
            <div>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {categories.map(category => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Stock Filter */}
            <div>
              <select
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={stockFilter}
                onChange={(e) => setStockFilter(e.target.value)}
              >
                <option value="">All Stock Status</option>
                <option value="in_stock">In Stock</option>
                <option value="low_stock">Low Stock</option>
                <option value="out_of_stock">Out of Stock</option>
              </select>
            </div>

            {/* Sort By */}
            <div className="flex space-x-2">
              <select
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <option value="name-asc">Name A-Z</option>
                <option value="name-desc">Name Z-A</option>
                <option value="stock-desc">Stock High-Low</option>
                <option value="stock-asc">Stock Low-High</option>
                <option value="price-desc">Price High-Low</option>
                <option value="price-asc">Price Low-High</option>
                <option value="created_at-desc">Newest First</option>
                <option value="created_at-asc">Oldest First</option>
              </select>
            </div>
          </div>
          
          {/* Filter Actions */}
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-200">
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-500">
                Showing {filteredProducts.length} of {products.length} products
              </span>
              {(searchTerm || selectedCategory || stockFilter) && (
                <Button variant="outline" size="sm" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
            
            {/* Bulk Actions */}
            {selectedProducts.length > 0 && (
              <div className="flex items-center space-x-3">
                <span className="text-sm text-gray-600">
                  {selectedProducts.length} selected
                </span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('update')}
                >
                  Bulk Update
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => handleBulkAction('delete')}
                  className="text-red-600 hover:text-red-700"
                >
                  Delete Selected
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Products Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {filteredProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-4 text-left">
                      <input
                        type="checkbox"
                        className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                        checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                        onChange={handleSelectAll}
                      />
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      SKU
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stock
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredProducts.map((product) => {
                    const stockStatus = getStockStatus(product);
                    return (
                      <tr key={product.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <input
                            type="checkbox"
                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            checked={selectedProducts.includes(product.id)}
                            onChange={() => handleProductSelect(product.id)}
                          />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-12 w-12">
                              {product.image ? (
                                <img 
                                  className="h-12 w-12 rounded-xl object-cover border border-gray-200" 
                                  src={product.image} 
                                  alt={product.name} 
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-xl bg-gray-100 flex items-center justify-center">
                                  <PhotoIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                              <div className="text-sm text-gray-500 truncate max-w-xs">
                                {product.description || 'No description'}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-gray-900">
                          {product.sku}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            {getCategoryName(product.category)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          <div className="flex items-center">
                            <span className="font-medium">{product.stock_quantity || 0}</span>
                            <span className="text-gray-500 ml-1">units</span>
                          </div>
                          <div className="text-xs text-gray-500">
                            Min: {product.threshold || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          {formatCurrency(product.price)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${stockStatus.color}`}>
                            {stockStatus.label}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewProduct(product)}
                              className="text-green-600 hover:text-green-700"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleEditProduct(product)}
                              className="text-blue-600 hover:text-blue-700"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleDeleteProduct(product.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-16">
              <CubeIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {products.length === 0 ? 'No products found' : 'No products match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {products.length === 0 
                  ? 'Get started by adding your first product to the inventory.'
                  : 'Try adjusting your search or filter criteria.'
                }
              </p>
              {products.length === 0 ? (
                <Button onClick={handleAddProduct}>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add First Product
                </Button>
              ) : (
                <Button variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Modals */}
        {showProductModal && (
          <ProductModal
            product={selectedProduct}
            categories={categories}
            onClose={() => setShowProductModal(false)}
            onSave={() => {
              setShowProductModal(false);
              fetchData();
              setSuccess(selectedProduct ? 'Product updated successfully' : 'Product added successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />
        )}

        {showCategoryModal && (
          <CategoryModal
            onClose={() => setShowCategoryModal(false)}
            onSave={() => {
              setShowCategoryModal(false);
              fetchData();
              setSuccess('Categories updated successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />
        )}

        {showViewModal && selectedProduct && (
          <ProductViewModal
            product={selectedProduct}
            categories={categories}
            onClose={() => setShowViewModal(false)}
            onEdit={() => {
              setShowViewModal(false);
              setShowProductModal(true);
            }}
          />
        )}

        {showBulkModal && (
          <BulkActionsModal
            selectedProducts={selectedProducts}
            allProducts={products}
            onClose={() => setShowBulkModal(false)}
            onComplete={() => {
              setShowBulkModal(false);
              setSelectedProducts([]);
              fetchData();
              setSuccess('Bulk action completed successfully');
              setTimeout(() => setSuccess(''), 3000);
            }}
          />
        )}
      </div>
    </div>
  );
};

export default Inventory;