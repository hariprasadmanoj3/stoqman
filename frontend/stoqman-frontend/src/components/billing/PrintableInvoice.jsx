import React, { forwardRef } from 'react';

const PrintableInvoice = forwardRef(({ invoice, customer, company }, ref) => {
  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN', { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2 
    })}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-500 text-white';
      case 'due': return 'bg-orange-500 text-white';
      case 'partial': return 'bg-yellow-500 text-white';
      case 'draft': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const defaultCompany = {
    name: 'STOQMAN',
    tagline: 'Smart Inventory & Billing Management',
    address: '123 Business Street, Tech City, State 123456',
    phone: '+91 9876543210',
    email: 'contact@stoqman.com',
    gstin: '29ABCDE1234F1Z5',
    website: 'www.stoqman.com',
    ...company
  };

  return (
    <div ref={ref} className="bg-white p-8 max-w-4xl mx-auto" style={{ fontFamily: 'Arial, sans-serif' }}>
      {/* Header */}
      <div className="flex justify-between items-start mb-8 border-b-2 border-green-500 pb-6">
        <div>
          <h1 className="text-4xl font-bold text-green-600 mb-2">{defaultCompany.name}</h1>
          <p className="text-gray-600 text-lg mb-4">{defaultCompany.tagline}</p>
          <div className="text-sm text-gray-700 space-y-1">
            <p>{defaultCompany.address}</p>
            <p>📞 {defaultCompany.phone} | 📧 {defaultCompany.email}</p>
            <p>🌐 {defaultCompany.website}</p>
            <p className="font-semibold">GSTIN: {defaultCompany.gstin}</p>
          </div>
        </div>
        
        <div className="text-right">
          <h2 className="text-3xl font-bold text-gray-800 mb-4">INVOICE</h2>
          <div className="bg-gray-100 p-4 rounded-lg">
            <div className="text-sm space-y-2">
              <div><strong>Invoice #:</strong> {invoice.invoice_number || 'N/A'}</div>
              <div><strong>Date:</strong> {formatDate(invoice.invoice_date)}</div>
              <div><strong>Due Date:</strong> {formatDate(invoice.due_date)}</div>
              <div className="pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(invoice.status)}`}>
                  {(invoice.status || 'draft').toUpperCase()}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Customer Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-green-500 pl-3">BILL TO</h3>
          <div className="bg-gray-50 p-4 rounded-lg">
            {customer ? (
              <div className="space-y-2">
                <p className="font-bold text-lg text-gray-900">{customer.name}</p>
                {customer.email && <p className="text-gray-700">📧 {customer.email}</p>}
                {customer.phone && <p className="text-gray-700">📞 {customer.phone}</p>}
                {customer.address && (
                  <p className="text-gray-700 mt-2">📍 {customer.address}</p>
                )}
                {customer.city && customer.state && (
                  <p className="text-gray-700">{customer.city}, {customer.state} {customer.postal_code}</p>
                )}
                {customer.gstin && (
                  <p className="text-gray-700 font-semibold mt-2">GSTIN: {customer.gstin}</p>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Customer information not available</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-gray-800 mb-3 border-l-4 border-blue-500 pl-3">PAYMENT INFO</h3>
          <div className="bg-blue-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-700">Payment Terms:</span>
              <span className="font-medium">Net 30 Days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-700">Payment Method:</span>
              <span className="font-medium">Bank Transfer / Cash</span>
            </div>
            {invoice.paid_date && (
              <div className="flex justify-between">
                <span className="text-gray-700">Paid Date:</span>
                <span className="font-medium text-green-600">{formatDate(invoice.paid_date)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <h3 className="text-lg font-bold text-gray-800 mb-4 border-l-4 border-orange-500 pl-3">
          ITEMS ({(invoice.items || []).length})
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse border border-gray-300">
            <thead>
              <tr className="bg-gray-100">
                <th className="border border-gray-300 px-4 py-3 text-left font-semibold">Description</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Qty</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Unit Price</th>
                <th className="border border-gray-300 px-4 py-3 text-center font-semibold">Tax %</th>
                <th className="border border-gray-300 px-4 py-3 text-right font-semibold">Amount</th>
              </tr>
            </thead>
            <tbody>
              {(invoice.items || []).length > 0 ? (
                invoice.items.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                    <td className="border border-gray-300 px-4 py-3">
                      <div className="font-medium text-gray-900">{item.product_name || item.description || 'N/A'}</div>
                      {item.description && item.product_name && item.description !== item.product_name && (
                        <div className="text-sm text-gray-600 mt-1">{item.description}</div>
                      )}
                    </td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{item.quantity || 0}</td>
                    <td className="border border-gray-300 px-4 py-3 text-right">{formatCurrency(item.unit_price)}</td>
                    <td className="border border-gray-300 px-4 py-3 text-center">{item.tax_rate || 0}%</td>
                    <td className="border border-gray-300 px-4 py-3 text-right font-semibold">
                      {formatCurrency(item.total_with_tax || (item.quantity * item.unit_price * (1 + (item.tax_rate || 0) / 100)))}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="border border-gray-300 px-4 py-8 text-center text-gray-500">
                    No items found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Totals Section */}
      <div className="flex justify-end mb-8">
        <div className="w-80">
          <div className="bg-gray-50 border border-gray-300 rounded-lg p-6">
            <div className="space-y-3">
              <div className="flex justify-between text-gray-700">
                <span>Subtotal:</span>
                <span className="font-medium">{formatCurrency(invoice.subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-700">
                <span>Tax Amount:</span>
                <span className="font-medium">{formatCurrency(invoice.tax_amount)}</span>
              </div>
              {(invoice.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">-{formatCurrency(invoice.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-400 pt-3">
                <div className="flex justify-between items-center">
                  <span className="text-xl font-bold text-gray-900">TOTAL:</span>
                  <span className="text-2xl font-bold text-green-600">{formatCurrency(invoice.total_amount)}</span>
                </div>
              </div>
              {(invoice.paid_amount || 0) > 0 && (
                <>
                  <div className="flex justify-between text-green-600">
                    <span>Paid Amount:</span>
                    <span className="font-medium">{formatCurrency(invoice.paid_amount)}</span>
                  </div>
                  {(invoice.remaining_amount || 0) > 0 && (
                    <div className="flex justify-between font-bold text-red-600">
                      <span>Balance Due:</span>
                      <span>{formatCurrency(invoice.remaining_amount)}</span>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Notes and Terms */}
      {(invoice.notes || invoice.terms) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
          {invoice.notes && (
            <div>
              <h4 className="font-bold text-gray-800 mb-2 border-l-4 border-purple-500 pl-3">NOTES</h4>
              <div className="bg-purple-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.notes}</p>
              </div>
            </div>
          )}
          {invoice.terms && (
            <div>
              <h4 className="font-bold text-gray-800 mb-2 border-l-4 border-indigo-500 pl-3">TERMS & CONDITIONS</h4>
              <div className="bg-indigo-50 p-4 rounded-lg">
                <p className="text-gray-700 whitespace-pre-wrap">{invoice.terms}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="border-t-2 border-gray-300 pt-6 mt-8">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-lg font-bold text-green-600 mb-2">Thank you for your business! 🙏</p>
            <p className="text-gray-600">For questions about this invoice, please contact us.</p>
          </div>
          <div className="text-right text-sm text-gray-500">
            <p>Generated on {new Date().toLocaleDateString('en-IN')} at {new Date().toLocaleTimeString('en-IN')}</p>
            <p className="font-medium">Powered by Stoqman</p>
          </div>
        </div>
      </div>

      {/* Print-only footer */}
      <div className="hidden print:block mt-8 pt-4 border-t border-gray-300 text-center text-xs text-gray-500">
        This is a computer-generated invoice and does not require a physical signature.
      </div>
    </div>
  );
});

PrintableInvoice.displayName = 'PrintableInvoice';

export default PrintableInvoice;