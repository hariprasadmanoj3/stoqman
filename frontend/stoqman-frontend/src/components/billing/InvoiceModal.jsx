import { useState, useEffect } from 'react';
import { XMarkIcon, PlusIcon, TrashIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';
import { invoiceAPI } from '../../services/api';

const InvoiceModal = ({ invoice, customers = [], products = [], onClose, onSave }) => {
  const [formData, setFormData] = useState({
    customer: '',
    invoice_number: '',
    invoice_date: new Date().toISOString().split('T')[0],
    due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    items: [{ 
      product: '', 
      product_name: '',
      description: '',
      quantity: 1, 
      unit_price: 0, 
      tax_rate: 18,
      total_with_tax: 0
    }],
    notes: '',
    terms: 'Payment due within 30 days. Late payments may incur additional charges.',
    status: 'draft',
    subtotal: 0,
    tax_amount: 0,
    discount_amount: 0,
    total_amount: 0
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [productSearch, setProductSearch] = useState({});

  useEffect(() => {
    if (invoice && invoice.id) {
      // Editing existing invoice
      setFormData({
        customer: invoice.customer || '',
        invoice_number: invoice.invoice_number || '',
        invoice_date: invoice.invoice_date || new Date().toISOString().split('T')[0],
        due_date: invoice.due_date || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        items: invoice.items && invoice.items.length > 0 ? invoice.items.map(item => ({
          product: item.product || '',
          product_name: item.product_name || item.description || '',
          description: item.description || '',
          quantity: parseFloat(item.quantity || 1),
          unit_price: parseFloat(item.unit_price || 0),
          tax_rate: parseFloat(item.tax_rate || 18),
          total_with_tax: parseFloat(item.total_with_tax || 0)
        })) : [{ 
          product: '', 
          product_name: '',
          description: '',
          quantity: 1, 
          unit_price: 0, 
          tax_rate: 18,
          total_with_tax: 0
        }],
        notes: invoice.notes || '',
        terms: invoice.terms || 'Payment due within 30 days. Late payments may incur additional charges.',
        status: invoice.status || 'draft',
        subtotal: parseFloat(invoice.subtotal || 0),
        tax_amount: parseFloat(invoice.tax_amount || 0),
        discount_amount: parseFloat(invoice.discount_amount || 0),
        total_amount: parseFloat(invoice.total_amount || 0)
      });
    } else {
      // Creating new invoice - generate invoice number
      generateInvoiceNumber();
    }
  }, [invoice]);

  // Auto-calculate totals when items change
  useEffect(() => {
    calculateTotals();
  }, [formData.items, formData.discount_amount]);

  const generateInvoiceNumber = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const time = String(today.getHours()).padStart(2, '0') + String(today.getMinutes()).padStart(2, '0');
    const invoiceNumber = `INV-${year}${month}${day}-${time}`;
    
    setFormData(prev => ({
      ...prev,
      invoice_number: invoiceNumber
    }));
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const getFilteredProducts = (searchTerm, currentIndex) => {
  if (!searchTerm || searchTerm.length < 1) return products.slice(0, 10);
  
  return products.filter(product => 
    product.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (product.category_name || '').toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 10);
};

  const selectProduct = (product, index) => {
    const newItems = [...formData.items];
    newItems[index] = {
      ...newItems[index],
      product: product.id,
      product_name: product.name,
      description: product.description || product.name,
      unit_price: parseFloat(product.price || 0),
      tax_rate: parseFloat(product.gst_rate || 18)
    };
    
    // Calculate total for this item
    const quantity = parseFloat(newItems[index].quantity || 0);
    const unitPrice = parseFloat(newItems[index].unit_price || 0);
    const taxRate = parseFloat(newItems[index].tax_rate || 0);
    const lineTotal = quantity * unitPrice;
    const taxAmount = lineTotal * (taxRate / 100);
    newItems[index].total_with_tax = lineTotal + taxAmount;
    
    setFormData(prev => ({ ...prev, items: newItems }));
    
    // Clear search for this item
    setProductSearch(prev => ({ ...prev, [index]: '' }));
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...formData.items];
    newItems[index] = { ...newItems[index], [field]: value };
    
    // Auto-calculate total if quantity, unit_price, or tax_rate changes
    if (field === 'quantity' || field === 'unit_price' || field === 'tax_rate') {
      const quantity = parseFloat(newItems[index].quantity || 0);
      const unitPrice = parseFloat(newItems[index].unit_price || 0);
      const taxRate = parseFloat(newItems[index].tax_rate || 0);
      const lineTotal = quantity * unitPrice;
      const taxAmount = lineTotal * (taxRate / 100);
      newItems[index].total_with_tax = lineTotal + taxAmount;
    }
    
    setFormData(prev => ({ ...prev, items: newItems }));
  };

  const handleProductSearch = (index, value) => {
    setProductSearch(prev => ({ ...prev, [index]: value }));
    
    // If search is cleared, clear the product selection
    if (!value) {
      const newItems = [...formData.items];
      newItems[index] = {
        ...newItems[index],
        product: '',
        product_name: '',
        description: '',
        unit_price: 0
      };
      setFormData(prev => ({ ...prev, items: newItems }));
    }
  };

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...prev.items, { 
        product: '', 
        product_name: '',
        description: '',
        quantity: 1, 
        unit_price: 0, 
        tax_rate: 18,
        total_with_tax: 0
      }]
    }));
  };

  const removeItem = (index) => {
    if (formData.items.length > 1) {
      setFormData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
      
      // Remove search state for this item
      setProductSearch(prev => {
        const newSearch = { ...prev };
        delete newSearch[index];
        return newSearch;
      });
    }
  };

  const calculateTotals = () => {
  let subtotal = 0;
  let taxAmount = 0;
  
  formData.items.forEach(item => {
    const quantity = parseFloat(item.quantity || 0);
    const unitPrice = parseFloat(item.unit_price || 0);
    const taxRate = parseFloat(item.tax_rate || 0);
    const lineTotal = quantity * unitPrice;
    const lineTax = lineTotal * (taxRate / 100);
    
    subtotal += lineTotal;
    taxAmount += lineTax;
    console.log(`Item: ${item.product_name}, Line Total: ${lineTotal}, Tax: ${lineTax}`);
  });
  
  const discountAmount = parseFloat(formData.discount_amount || 0);
  const totalAmount = subtotal + taxAmount - discountAmount;
  
  console.log(`Subtotal: ${subtotal}, Tax: ${taxAmount}, Discount: ${discountAmount}, Total: ${totalAmount}`);
  
  setFormData(prev => ({
    ...prev,
    subtotal: Number(subtotal.toFixed(2)),
    tax_amount: Number(taxAmount.toFixed(2)),
    total_amount: Number(totalAmount.toFixed(2))
  }));
};

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.customer) {
      newErrors.customer = 'Customer is required';
    }
    
    if (!formData.invoice_date) {
      newErrors.invoice_date = 'Invoice date is required';
    }
    
    if (!formData.due_date) {
      newErrors.due_date = 'Due date is required';
    }
    
    if (new Date(formData.due_date) < new Date(formData.invoice_date)) {
      newErrors.due_date = 'Due date must be after invoice date';
    }
    
    if (formData.items.length === 0) {
      newErrors.items = 'At least one item is required';
    }
    
    formData.items.forEach((item, index) => {
      if (!item.product_name && !item.description) {
        newErrors[`item_${index}`] = 'Product or description is required';
      }
      if (!item.quantity || item.quantity <= 0) {
        newErrors[`item_quantity_${index}`] = 'Valid quantity is required';
      }
      if (item.unit_price < 0) {
        newErrors[`item_price_${index}`] = 'Unit price cannot be negative';
      }
      if (item.tax_rate < 0 || item.tax_rate > 100) {
        newErrors[`item_tax_${index}`] = 'Tax rate must be between 0 and 100';
      }
    });
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      const invoiceData = {
        ...formData,
        items: formData.items.map(item => ({
          product: item.product || null,
          product_name: item.product_name || item.description,
          description: item.description || item.product_name,
          quantity: parseFloat(item.quantity),
          unit_price: parseFloat(item.unit_price),
          tax_rate: parseFloat(item.tax_rate),
          total_with_tax: parseFloat(item.total_with_tax)
        }))
      };
      
      if (invoice && invoice.id) {
        await invoiceAPI.update(invoice.id, invoiceData);
      } else {
        await invoiceAPI.create(invoiceData);
      }
      
      onSave();
    } catch (error) {
      console.error('Error saving invoice:', error);
      setErrors({ submit: 'Failed to save invoice. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getSelectedCustomer = () => {
    return customers.find(c => c.id === formData.customer);
  };

  const selectedCustomer = getSelectedCustomer();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-6xl w-full max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl shadow-sm">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {invoice && invoice.id ? '✏️ Edit Invoice' : '✨ Create New Invoice'}
            </h2>
            <p className="text-gray-600 mt-1">
              {invoice && invoice.id ? 'Update invoice details' : 'Fill in the details to create a new invoice'}
            </p>
          </div>
          <button 
            onClick={onClose} 
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-lg hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6">
          
          {/* Invoice Header Info */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  📄 Invoice Number
                </label>
                <input
                  type="text"
                  value={formData.invoice_number}
                  onChange={(e) => handleInputChange('invoice_number', e.target.value)}
                  className="w-full px-4 py-3 border border-green-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
                  placeholder="Auto-generated"
                  readOnly={!invoice?.id}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  📅 Invoice Date *
                </label>
                <input
                  type="date"
                  value={formData.invoice_date}
                  onChange={(e) => handleInputChange('invoice_date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.invoice_date ? 'border-red-500 bg-red-50' : 'border-green-300 bg-white'
                  }`}
                  required
                />
                {errors.invoice_date && <p className="text-red-500 text-sm mt-1">{errors.invoice_date}</p>}
              </div>

              <div>
                <label className="block text-sm font-semibold text-green-800 mb-2">
                  ⏰ Due Date *
                </label>
                <input
                  type="date"
                  value={formData.due_date}
                  onChange={(e) => handleInputChange('due_date', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                    errors.due_date ? 'border-red-500 bg-red-50' : 'border-green-300 bg-white'
                  }`}
                  required
                />
                {errors.due_date && <p className="text-red-500 text-sm mt-1">{errors.due_date}</p>}
              </div>
            </div>
          </div>

          {/* Customer and Status */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                👤 Select Customer *
              </label>
              <select
                value={formData.customer}
                onChange={(e) => handleInputChange('customer', e.target.value)}
                className={`w-full px-4 py-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 ${
                  errors.customer ? 'border-red-500 bg-red-50' : 'border-gray-300 bg-white'
                }`}
                required
              >
                <option value="">Choose a customer...</option>
                {customers.map(customer => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} {customer.email && `(${customer.email})`}
                  </option>
                ))}
              </select>
              {errors.customer && <p className="text-red-500 text-sm mt-1">{errors.customer}</p>}
              
              {selectedCustomer && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <h4 className="font-medium text-blue-900">Customer Details:</h4>
                  <p className="text-blue-800 text-sm mt-1">{selectedCustomer.name}</p>
                  {selectedCustomer.email && <p className="text-blue-700 text-sm">📧 {selectedCustomer.email}</p>}
                  {selectedCustomer.phone && <p className="text-blue-700 text-sm">📞 {selectedCustomer.phone}</p>}
                  {selectedCustomer.address && <p className="text-blue-700 text-sm">📍 {selectedCustomer.address}</p>}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🏷️ Invoice Status
              </label>
              <select
                value={formData.status}
                onChange={(e) => handleInputChange('status', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="draft">📝 Draft</option>
                <option value="due">💳 Due</option>
                <option value="partial">⏳ Partially Paid</option>
                <option value="paid">✅ Paid</option>
                <option value="cancelled">❌ Cancelled</option>
              </select>

              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <h4 className="font-medium text-gray-900 mb-2">💰 Quick Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Items:</span>
                    <span className="font-medium">{formData.items.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                  </div>
                  <div className="flex justify-between border-t border-gray-300 pt-1">
                    <span className="font-semibold text-gray-900">Total:</span>
                    <span className="font-bold text-green-600">{formatCurrency(formData.total_amount)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Items Section */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                🛒 Invoice Items
                <span className="ml-2 text-sm font-normal text-gray-500">({formData.items.length} items)</span>
              </h3>
              <Button
                type="button"
                onClick={addItem}
                className="bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Add Item</span>
              </Button>
            </div>

            <div className="space-y-6">
              {formData.items.map((item, index) => (
                <div key={index} className="border border-gray-200 rounded-xl p-6 bg-gray-50">
                  <div className="flex justify-between items-start mb-4">
                    <h4 className="font-semibold text-gray-900">Item #{index + 1}</h4>
                    {formData.items.length > 1 && (
                      <Button
                        type="button"
                        onClick={() => removeItem(index)}
                        variant="outline"
                        className="text-red-600 border-red-300 hover:bg-red-50 p-2"
                      >
                        <TrashIcon className="w-4 h-4" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                    {/* Product Search */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        🔍 Search & Select Product
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          value={productSearch[index] || item.product_name || ''}
                          onChange={(e) => handleProductSearch(index, e.target.value)}
                          placeholder="Search by product name, SKU, or category..."
                          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                        />
                        <MagnifyingGlassIcon className="w-5 h-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                        
                        {/* Product Dropdown */}
                        {productSearch[index] && productSearch[index].length > 0 && (
                          <div className="absolute z-10 w-full bg-white border border-gray-300 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                            {getFilteredProducts(productSearch[index], index).map(product => (
                              <button
                                key={product.id}
                                type="button"
                                onClick={() => selectProduct(product, index)}
                                className="w-full px-4 py-3 text-left hover:bg-green-50 border-b border-gray-100 last:border-b-0"
                              >
                                <div className="font-medium text-gray-900">{product.name}</div>
                                <div className="text-sm text-gray-600">
                                  SKU: {product.sku || 'N/A'} | 
                                  Category: {product.category_name || 'N/A'} | 
                                  Price: {formatCurrency(product.price || 0)}
                                </div>
                                {product.description && (
                                  <div className="text-sm text-gray-500 truncate">{product.description}</div>
                                )}
                              </button>
                            ))}
                            {getFilteredProducts(productSearch[index], index).length === 0 && (
                              <div className="px-4 py-3 text-gray-500 text-center">
                                No products found. Try a different search term.
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Manual Description */}
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📝 Description *
                      </label>
                      <textarea
                        value={item.description || ''}
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)}
                        placeholder="Enter item description or details..."
                        rows="2"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 resize-none ${
                          errors[`item_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors[`item_${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`item_${index}`]}</p>}
                    </div>

                    {/* Quantity */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📦 Quantity *
                      </label>
                      <input
                        type="number"
                        value={item.quantity || ''}
                        onChange={(e) => handleItemChange(index, 'quantity', e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`item_quantity_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors[`item_quantity_${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`item_quantity_${index}`]}</p>}
                    </div>

                    {/* Unit Price */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💰 Unit Price *
                      </label>
                      <input
                        type="number"
                        value={item.unit_price || ''}
                        onChange={(e) => handleItemChange(index, 'unit_price', e.target.value)}
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`item_price_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                        required
                      />
                      {errors[`item_price_${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`item_price_${index}`]}</p>}
                    </div>

                    {/* Tax Rate */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        📊 Tax Rate (%)
                      </label>
                      <input
                        type="number"
                        value={item.tax_rate || ''}
                        onChange={(e) => handleItemChange(index, 'tax_rate', e.target.value)}
                        min="0"
                        max="100"
                        step="0.01"
                        className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 ${
                          errors[`item_tax_${index}`] ? 'border-red-500 bg-red-50' : 'border-gray-300'
                        }`}
                      />
                      {errors[`item_tax_${index}`] && <p className="text-red-500 text-sm mt-1">{errors[`item_tax_${index}`]}</p>}
                    </div>

                    {/* Item Total */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        💵 Item Total
                      </label>
                      <div className="px-4 py-3 bg-green-50 border border-green-200 rounded-lg">
                        <span className="font-bold text-green-700 text-lg">
                          {formatCurrency(item.total_with_tax || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Additional Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📝 Notes
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Add any additional notes or special instructions..."
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                📋 Terms & Conditions
              </label>
              <textarea
                value={formData.terms}
                onChange={(e) => handleInputChange('terms', e.target.value)}
                rows="4"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
                placeholder="Payment terms, conditions, etc..."
              />
            </div>
          </div>

          {/* Discount */}
          <div className="mb-8">
            <div className="max-w-md">
              <label className="block text-sm font-semibold text-gray-700 mb-3">
                🎫 Discount Amount
              </label>
              <input
                type="number"
                value={formData.discount_amount || ''}
                onChange={(e) => handleInputChange('discount_amount', e.target.value)}
                min="0"
                step="0.01"
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                placeholder="0.00"
              />
            </div>
          </div>

          {/* Totals Summary */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 mb-8">
            <h3 className="text-lg font-bold text-green-900 mb-4">💰 Invoice Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex justify-between text-gray-700">
                  <span>Subtotal:</span>
                  <span className="font-medium">{formatCurrency(formData.subtotal)}</span>
                </div>
                <div className="flex justify-between text-gray-700">
                  <span>Tax Amount:</span>
                  <span className="font-medium">{formatCurrency(formData.tax_amount)}</span>
                </div>
                {formData.discount_amount > 0 && (
                  <div className="flex justify-between text-red-600">
                    <span>Discount:</span>
                    <span className="font-medium">-{formatCurrency(formData.discount_amount)}</span>
                  </div>
                )}
              </div>
              <div className="flex justify-end">
                <div className="bg-white rounded-lg p-4 border-2 border-green-300 shadow-sm">
                  <div className="text-center">
                    <p className="text-sm font-medium text-gray-600 mb-1">Total Amount</p>
                    <p className="text-3xl font-bold text-green-600">{formatCurrency(formData.total_amount)}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Submit Errors */}
          {errors.submit && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-700 font-medium">❌ {errors.submit}</p>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={loading}
              className="px-6 py-3"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 focus:ring-green-500 px-8 py-3 font-semibold"
            >
              {loading ? (
                <span className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </span>
              ) : (
                <>
                  {invoice && invoice.id ? '✏️ Update Invoice' : '✨ Create Invoice'}
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default InvoiceModal;