import { XMarkIcon, PencilIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { 
  CubeIcon, 
  TagIcon, 
  CurrencyDollarIcon,
  CalendarDaysIcon 
} from '@heroicons/react/24/solid';
import Button from '../ui/Button';

const ProductViewModal = ({ product, categories, onClose, onEdit }) => {
  const getCategoryName = (categoryId) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Uncategorized';
  };

  const getStockStatus = () => {
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

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const stockStatus = getStockStatus();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Product Details</h2>
          <div className="flex items-center space-x-3">
            <Button
              variant="outline"
              onClick={onEdit}
              className="flex items-center space-x-2"
            >
              <PencilIcon className="w-4 h-4" />
              <span>Edit</span>
            </Button>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            
            {/* Product Image */}
            <div className="lg:col-span-1">
              <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                {product.image ? (
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <PhotoIcon className="w-24 h-24 text-gray-300" />
                  </div>
                )}
              </div>
            </div>

            {/* Product Information */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* Basic Info */}
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
                <div className="flex items-center space-x-4 mb-4">
                  <span className="text-lg font-mono text-gray-600 bg-gray-100 px-3 py-1 rounded-lg">
                    {product.sku}
                  </span>
                  <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${stockStatus.color}`}>
                    {stockStatus.label}
                  </span>
                </div>
                {product.description && (
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                )}
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-xl border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-green-700">{formatCurrency(product.price)}</p>
                  <p className="text-sm text-green-600">Price</p>
                </div>

                <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <CubeIcon className="w-6 h-6 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-blue-700">{product.stock_quantity || 0}</p>
                  <p className="text-sm text-blue-600">In Stock</p>
                </div>

                <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-200">
                  <div className="flex items-center justify-between mb-2">
                    <TagIcon className="w-6 h-6 text-yellow-600" />
                  </div>
                  <p className="text-2xl font-bold text-yellow-700">{product.threshold || 0}</p>
                  <p className="text-sm text-yellow-600">Min Stock</p>
                </div>

                <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <CalendarDaysIcon className="w-6 h-6 text-purple-600" />
                  </div>
                  <p className="text-lg font-bold text-purple-700">
                    {formatCurrency((product.price || 0) * (product.stock_quantity || 0))}
                  </p>
                  <p className="text-sm text-purple-600">Total Value</p>
                </div>
              </div>

              {/* Detailed Information */}
              <div className="bg-gray-50 rounded-2xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Product Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Category</label>
                    <p className="text-gray-900 font-medium">{getCategoryName(product.category)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">SKU</label>
                    <p className="text-gray-900 font-mono">{product.sku}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Price</label>
                    <p className="text-gray-900 font-semibold">{formatCurrency(product.price)}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Stock Quantity</label>
                    <p className="text-gray-900 font-semibold">{product.stock_quantity || 0} units</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Low Stock Threshold</label>
                    <p className="text-gray-900">{product.threshold || 0} units</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created Date</label>
                    <p className="text-gray-900">{formatDate(product.created_at)}</p>
                  </div>

                  {product.updated_at && (
                    <div>
                      <label className="block text-sm font-medium text-gray-500 mb-1">Last Updated</label>
                      <p className="text-gray-900">{formatDate(product.updated_at)}</p>
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Total Value</label>
                    <p className="text-gray-900 font-semibold">
                      {formatCurrency((product.price || 0) * (product.stock_quantity || 0))}
                    </p>
                  </div>
                </div>

                {product.description && (
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Description</label>
                    <p className="text-gray-900 leading-relaxed">{product.description}</p>
                  </div>
                )}
              </div>

              {/* Stock Alert */}
              {product.is_low_stock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h3 className="text-sm font-medium text-yellow-800">Low Stock Alert</h3>
                      <p className="text-sm text-yellow-700">
                        This product is running low. Current stock: {product.stock_quantity}, Minimum required: {product.threshold}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductViewModal;