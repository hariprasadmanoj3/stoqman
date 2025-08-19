import { useState } from 'react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import { invoiceAPI } from '../../services/api';
import Button from '../ui/Button';

const PaymentModal = ({ invoice, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    amount: '',
    payment_method: 'cash',
    reference_number: '',
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

    const amount = parseFloat(formData.amount);
    const balanceDue = parseFloat(invoice.balance_due);

    if (amount <= 0) {
      setError('Payment amount must be greater than 0');
      setLoading(false);
      return;
    }

    if (amount > balanceDue) {
      setError('Payment amount cannot exceed balance due');
      setLoading(false);
      return;
    }

    try {
      // Create payment record (you'll need to implement this API endpoint)
      const paymentData = {
        invoice: invoice.id,
        amount: amount,
        payment_method: formData.payment_method,
        reference_number: formData.reference_number,
        notes: formData.notes
      };

      // For now, we'll simulate the API call
      // await paymentAPI.create(paymentData);
      console.log('Payment data:', paymentData);
      
      onSave();
    } catch (err) {
      setError(err.response?.data?.detail || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const balanceDue = parseFloat(invoice.balance_due);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl max-w-lg w-full">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Add Payment</h2>
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

          {/* Invoice Info */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900">Invoice #{invoice.invoice_number}</h3>
            <p className="text-sm text-gray-600">Customer: {invoice.customer_name}</p>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Total Amount:</span>
              <span>₹{parseFloat(invoice.total).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>Amount Paid:</span>
              <span>₹{parseFloat(invoice.amount_paid).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm font-medium text-gray-900 border-t pt-2 mt-2">
              <span>Balance Due:</span>
              <span>₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Payment Amount */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Amount *
            </label>
            <input
              type="number"
              name="amount"
              required
              min="0.01"
              max={balanceDue}
              step="0.01"
              className="input-field"
              value={formData.amount}
              onChange={handleChange}
              placeholder="0.00"
            />
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Payment Method *
            </label>
            <select
              name="payment_method"
              required
              className="input-field"
              value={formData.payment_method}
              onChange={handleChange}
            >
              <option value="cash">Cash</option>
              <option value="upi">UPI</option>
              <option value="card">Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cheque">Cheque</option>
            </select>
          </div>

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reference Number
            </label>
            <input
              type="text"
              name="reference_number"
              className="input-field"
              value={formData.reference_number}
              onChange={handleChange}
              placeholder="Transaction ID, Cheque number, etc."
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
              {loading ? 'Processing...' : 'Add Payment'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PaymentModal;