import { XMarkIcon, PrinterIcon, PencilIcon, DocumentDuplicateIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

const SafeInvoiceModal = (props) => {
  console.log('SafeInvoiceModal props:', props); // Debug log
  
  // Safely destructure props
  const invoice = props?.invoice;
  const customers = props?.customers || [];
  const onClose = props?.onClose || (() => {});
  const onEdit = props?.onEdit;
  const onMarkPaid = props?.onMarkPaid;
  const onDuplicate = props?.onDuplicate;

  // Early return if no invoice
  if (!invoice) {
    console.log('No invoice provided to SafeInvoiceModal');
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">No Invoice Data</h2>
          <p className="text-gray-600 mb-6">Invoice information is not available.</p>
          <Button onClick={onClose}>Close</Button>
        </div>
      </div>
    );
  }

  // Safely find customer
  let customer = null;
  try {
    if (invoice.customer && Array.isArray(customers)) {
      customer = customers.find(c => {
        // Extra safety check
        if (!c || typeof c !== 'object') return false;
        return c.id === invoice.customer;
      });
    }
  } catch (error) {
    console.error('Error finding customer:', error);
  }

  console.log('Customer found:', customer); // Debug log

  const formatCurrency = (amount) => {
    try {
      return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
    } catch {
      return '₹0';
    }
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
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    switch (status.toLowerCase()) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'due': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[95vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center rounded-t-2xl">
          <h2 className="text-xl font-semibold text-gray-900">Invoice Details</h2>
          <div className="flex items-center space-x-3">
            <Button variant="outline" onClick={() => window.print()}>
              <PrinterIcon className="w-4 h-4 mr-2" />
              Print
            </Button>
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <PencilIcon className="w-4 h-4 mr-2" />
                Edit
              </Button>
            )}
            <Button variant="outline" onClick={() => onDuplicate && onDuplicate(invoice)}>
              <DocumentDuplicateIcon className="w-4 h-4 mr-2" />
              Duplicate
            </Button>
            {invoice.status !== 'paid' && onMarkPaid && (
              <Button onClick={() => onMarkPaid(invoice.id)} className="bg-green-600 hover:bg-green-700">
                <CheckCircleIcon className="w-4 h-4 mr-2" />
                Mark Paid
              </Button>
            )}
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
              <XMarkIcon className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Invoice Content */}
        <div className="p-8">
          
          {/* Invoice Header */}
          <div className="flex justify-between items-start mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">INVOICE</h1>
              <p className="text-lg text-gray-600 mt-1">{invoice.invoice_number || 'N/A'}</p>
            </div>
            <div className="text-right">
              <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full border ${getStatusColor(invoice.status)}`}>
                {invoice.status ? invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1) : 'Unknown'}
              </span>
            </div>
          </div>

          {/* Billing Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Bill To:</h3>
              <div className="text-gray-700">
                {customer ? (
                  <>
                    <p className="font-medium text-lg">{customer.name || 'N/A'}</p>
                    {customer.email && <p className="text-gray-600">{customer.email}</p>}
                    {customer.phone && <p className="text-gray-600">{customer.phone}</p>}
                    {customer.address && <p className="text-gray-600 mt-2">{customer.address}</p>}
                    {(customer.city || customer.state) && (
                      <p className="text-gray-600">
                        {[customer.city, customer.state, customer.postal_code].filter(Boolean).join(', ')}
                      </p>
                    )}
                    {customer.gstin && <p className="text-gray-600 mt-2">GSTIN: {customer.gstin}</p>}
                  </>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <p className="text-yellow-800 font-medium flex items-center">
                      ⚠️ Customer Information Unavailable
                    </p>
                    <p className="text-yellow-600 text-sm mt-1">
                      Customer ID: {invoice.customer || 'N/A'}
                    </p>
                    <p className="text-yellow-600 text-sm">
                      The customer may have been deleted or is not accessible.
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Invoice Details:</h3>
              <div className="space-y-3 text-gray-700">
                <div className="flex justify-between">
                  <span>Invoice Date:</span>
                  <span className="font-medium">{formatDate(invoice.invoice_date)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date:</span>
                  <span className="font-medium">{formatDate(invoice.due_date)}</span>
                </div>
                {invoice.paid_date && (
                  <div className="flex justify-between">
                    <span>Paid Date:</span>
                    <span className="font-medium text-green-600">{formatDate(invoice.paid_date)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="font-medium capitalize">{invoice.status || 'Unknown'}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Invoice Items */}
          <div className="mb-8">
            <h3 className="font-semibold text-gray-900 mb-4">Items</h3>
            <div className="overflow-x-auto">
              <table className="w-full border border-gray-200 rounded-lg">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Description</th>
                    <th className="px-4 py-3 text-center text-sm font-medium text-gray-900">Qty</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Unit Price</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Tax</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {invoice.items && Array.isArray(invoice.items) && invoice.items.length > 0 ? (
                    invoice.items.map((item, index) => (
                      <tr key={item?.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">
                              {item?.product_name || item?.description || 'Product'}
                            </p>
                            {item?.description && item?.product_name && item.description !== item.product_name && (
                              <p className="text-sm text-gray-600">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-center text-gray-900">{item?.quantity || 0}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{formatCurrency(item?.unit_price)}</td>
                        <td className="px-4 py-3 text-right text-gray-900">{item?.tax_rate || 0}%</td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          {formatCurrency(
                            item?.total_with_tax || 
                            ((item?.quantity || 0) * (item?.unit_price || 0) * (1 + ((item?.tax_rate || 0) / 100)))
                          )}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <div className="text-gray-400 text-4xl mb-2">📋</div>
                          <p className="font-medium text-gray-600">No items found</p>
                          <p className="text-sm text-gray-500 mt-1">This invoice has no items added yet.</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Invoice Totals */}
          <div className="flex justify-end">
            <div className="w-80">
              <div className="bg-gray-50 rounded-lg p-6 border border-gray-200">
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
                    <div className="flex justify-between text-gray-700">
                      <span>Discount:</span>
                      <span className="font-medium text-red-600">-{formatCurrency(invoice.discount_amount)}</span>
                    </div>
                  )}
                  <div className="border-t border-gray-300 pt-3">
                    <div className="flex justify-between items-center text-lg font-bold text-gray-900">
                      <span>Total Amount:</span>
                      <span className="text-green-600">{formatCurrency(invoice.total_amount)}</span>
                    </div>
                  </div>
                  {(invoice.paid_amount || 0) > 0 && (
                    <>
                      <div className="flex justify-between text-green-600 border-t border-gray-200 pt-3">
                        <span>Paid Amount:</span>
                        <span className="font-medium">{formatCurrency(invoice.paid_amount)}</span>
                      </div>
                      {(invoice.remaining_amount || (invoice.total_amount - invoice.paid_amount)) > 0 && (
                        <div className="flex justify-between font-medium text-red-600">
                          <span>Balance Due:</span>
                          <span>{formatCurrency(invoice.remaining_amount || (invoice.total_amount - invoice.paid_amount))}</span>
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
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
              {invoice.notes && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📝 Notes</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{invoice.notes}</p>
                  </div>
                </div>
              )}
              {invoice.terms && (
                <div>
                  <h4 className="font-semibold text-gray-900 mb-2">📋 Terms & Conditions</h4>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-gray-700 text-sm leading-relaxed">{invoice.terms}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Debug Info in Development */}
          {process.env.NODE_ENV === 'development' && (
            <div className="mt-8 p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-900 mb-2">🐛 Debug Information</h4>
              <div className="text-xs text-purple-700 space-y-1 font-mono">
                <p>Component: SafeInvoiceModal</p>
                <p>Invoice ID: {invoice?.id || 'N/A'}</p>
                <p>Customer ID: {invoice?.customer || 'N/A'}</p>
                <p>Customers Array Length: {Array.isArray(customers) ? customers.length : 'Not an array'}</p>
                <p>Customer Found: {customer ? `Yes - ${customer.name}` : 'No'}</p>
                <p>Items Count: {invoice?.items?.length || 0}</p>
                <p>Status: {invoice?.status || 'N/A'}</p>
                <p>Total Amount: {invoice?.total_amount || 0}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SafeInvoiceModal;