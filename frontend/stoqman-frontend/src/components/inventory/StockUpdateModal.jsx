import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { productAPI } from '../../services/api';
import Button from '../ui/Button';

const StockUpdateModal = ({ product, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    movement_type: 'in',
    quantity: '',
    reference: '',
    notes: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      await productAPI.updateStock(product.id, {
        ...formData,
        quantity: parseInt(formData.quantity)
      });
      onSave();
    } catch (err) {
      setError(err.response?.data?.error || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getNewStockLevel = () => {
    const quantity = parseInt(formData.quantity) || 0;
    const currentStock = product.stock_quantity;
    
    switch (formData.movement_type) {
      case 'in':
        return currentStock + quantity;
      case 'out':
        return Math.max(0, currentStock - quantity);
      case 'adjustment':
        return quantity;
      default:
        return currentStock;
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Update Stock</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {/* Product Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">{product.name}</h3>
            <p className="text-sm text-gray-600">SKU: {product.sku}</p>
            <p className="text-sm text-gray-600">Current Stock: {product.stock_quantity}</p>
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type *
            </label>
            <select
              name="movement_type"
              required
              className="input-field"
              value={formData.movement_type}
              onChange={handleChange}
            >
              <option value="in">Stock In</option>
              <option value="out">Stock Out</option>
              <option value="adjustment">Adjustment</option>
            </select>
          </div>

          {/* Quantity */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {formData.movement_type === 'adjustment' ? 'New Stock Level *' : 'Quantity *'}
            </label>
            <input
              type="number"
              name="quantity"
              required
              min="0"
              className="input-field"
              value={formData.quantity}
              onChange={handleChange}
              placeholder={formData.movement_type === 'adjustment' ? 'Enter new stock level' : 'Enter quantity'}
            />
            {formData.quantity && (
              <p className="mt-1 text-sm text-gray-600">
                New stock level will be: <span className="font-medium">{getNewStockLevel()}</span>
              </p>
            )}
          </div>

          {/* Reference */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference
            </label>
            <input
              type="text"
              name="reference"
              className="input-field"
              value={formData.reference}
              onChange={handleChange}
              placeholder="Invoice number, PO number, etc."
            />
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notes
            </label>
            <textarea
              name="notes"
              rows="3"
              className="input-field"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Additional notes..."
            />
          </div>

          {/* Form Actions */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockUpdateModal;