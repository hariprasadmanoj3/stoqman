import { useState } from 'react';
import { XMarkIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { productAPI } from '../../services/api';
import Button from '../ui/Button';

const BulkActionsModal = ({ selectedProducts, allProducts, onClose, onComplete }) => {
  const [action, setAction] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [bulkData, setBulkData] = useState({
    price_adjustment: '',
    price_type: 'percentage', // percentage or fixed
    stock_adjustment: '',
    stock_type: 'add', // add or set
    category: ''
  });

  const selectedProductsData = allProducts.filter(p => selectedProducts.includes(p.id));

  const handleBulkAction = async () => {
    if (!action) {
      setError('Please select an action');
      return;
    }

    setLoading(true);
    setError('');

    try {
      switch (action) {
        case 'delete':
          await handleBulkDelete();
          break;
        case 'price_update':
          await handleBulkPriceUpdate();
          break;
        case 'stock_update':
          await handleBulkStockUpdate();
          break;
        case 'category_update':
          await handleBulkCategoryUpdate();
          break;
        default:
          setError('Invalid action selected');
          return;
      }
      
      onComplete();
    } catch (err) {
      console.error('Bulk action error:', err);
      setError('Failed to perform bulk action. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products? This action cannot be undone.`)) {
      setLoading(false);
      return;
    }

    const deletePromises = selectedProducts.map(productId => 
      productAPI.delete(productId).catch(err => ({ error: err, productId }))
    );
    
    await Promise.all(deletePromises);
  };

  const handleBulkPriceUpdate = async () => {
    const adjustment = parseFloat(bulkData.price_adjustment);
    if (!adjustment || adjustment <= 0) {
      setError('Please enter a valid price adjustment');
      return;
    }

    const updatePromises = selectedProductsData.map(product => {
      let newPrice;
      if (bulkData.price_type === 'percentage') {
        newPrice = parseFloat(product.price) * (1 + adjustment / 100);
      } else {
        newPrice = parseFloat(product.price) + adjustment;
      }
      
      return productAPI.update(product.id, { price: Math.max(0, newPrice) });
    });

    await Promise.all(updatePromises);
  };

  const handleBulkStockUpdate = async () => {
    const adjustment = parseInt(bulkData.stock_adjustment);
    if (isNaN(adjustment)) {
      setError('Please enter a valid stock adjustment');
      return;
    }

    const updatePromises = selectedProductsData.map(product => {
      let newStock;
      if (bulkData.stock_type === 'add') {
        newStock = parseInt(product.stock_quantity) + adjustment;
      } else {
        newStock = adjustment;
      }
      
      return productAPI.update(product.id, { stock_quantity: Math.max(0, newStock) });
    });

    await Promise.all(updatePromises);
  };

  const handleBulkCategoryUpdate = async () => {
    if (!bulkData.category) {
      setError('Please select a category');
      return;
    }

    const updatePromises = selectedProducts.map(productId => 
      productAPI.update(productId, { category: bulkData.category })
    );

    await Promise.all(updatePromises);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">
            Bulk Actions ({selectedProducts.length} products selected)
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          
          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center">
              <ExclamationTriangleIcon className="w-5 h-5 mr-2" />
              {error}
            </div>
          )}

          {/* Selected Products Preview */}
          <div className="bg-gray-50 rounded-xl p-4">
            <h3 className="font-medium text-gray-900 mb-2">Selected Products:</h3>
            <div className="max-h-32 overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {selectedProductsData.slice(0, 5).map(product => (
                  <div key={product.id} className="text-sm text-gray-600">
                    {product.name} ({product.sku})
                  </div>
                ))}
                {selectedProductsData.length > 5 && (
                  <div className="text-sm text-gray-500">
                    ... and {selectedProductsData.length - 5} more
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Action Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Select Action
            </label>
            <div className="space-y-3">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="delete"
                  checked={action === 'delete'}
                  onChange={(e) => setAction(e.target.value)}
                  className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">Delete Products</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="price_update"
                  checked={action === 'price_update'}
                  onChange={(e) => setAction(e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">Update Prices</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="stock_update"
                  checked={action === 'stock_update'}
                  onChange={(e) => setAction(e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">Update Stock</span>
              </label>
              
              <label className="flex items-center">
                <input
                  type="radio"
                  name="action"
                  value="category_update"
                  checked={action === 'category_update'}
                  onChange={(e) => setAction(e.target.value)}
                  className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300"
                />
                <span className="ml-3 text-sm text-gray-900">Update Category</span>
              </label>
            </div>
          </div>

          {/* Action-specific inputs */}
          {action === 'price_update' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Price Adjustment
                </label>
                <div className="flex space-x-3">
                  <select
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={bulkData.price_type}
                    onChange={(e) => setBulkData(prev => ({ ...prev, price_type: e.target.value }))}
                  >
                    <option value="percentage">Percentage</option>
                    <option value="fixed">Fixed Amount</option>
                  </select>
                  <input
                    type="number"
                    step="0.01"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder={bulkData.price_type === 'percentage' ? 'e.g., 10 for 10%' : 'e.g., 100 for ₹100'}
                    value={bulkData.price_adjustment}
                    onChange={(e) => setBulkData(prev => ({ ...prev, price_adjustment: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {action === 'stock_update' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Stock Adjustment
                </label>
                <div className="flex space-x-3">
                  <select
                    className="px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    value={bulkData.stock_type}
                    onChange={(e) => setBulkData(prev => ({ ...prev, stock_type: e.target.value }))}
                  >
                    <option value="add">Add to current</option>
                    <option value="set">Set to value</option>
                  </select>
                  <input
                    type="number"
                    min="0"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Enter quantity"
                    value={bulkData.stock_adjustment}
                    onChange={(e) => setBulkData(prev => ({ ...prev, stock_adjustment: e.target.value }))}
                  />
                </div>
              </div>
            </div>
          )}

          {action === 'category_update' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Category
              </label>
              <select
                className="w-full px-3 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                value={bulkData.category}
                onChange={(e) => setBulkData(prev => ({ ...prev, category: e.target.value }))}
              >
                <option value="">Select Category</option>
                {/* Categories would be passed as props */}
              </select>
            </div>
          )}

          {/* Warning for delete action */}
          {action === 'delete' && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-4">
              <div className="flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-red-500 mr-2" />
                <div>
                  <h3 className="text-sm font-medium text-red-800">Warning</h3>
                  <p className="text-sm text-red-700">
                    This action will permanently delete {selectedProducts.length} products. This cannot be undone.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              onClick={handleBulkAction}
              disabled={loading || !action}
              className={action === 'delete' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {loading ? 'Processing...' : 'Apply Changes'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BulkActionsModal;