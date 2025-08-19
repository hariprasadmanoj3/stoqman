import { useState, useEffect } from 'react';
import { 
  PlusIcon, 
  EyeIcon, 
  PencilIcon, 
  TrashIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  DocumentDuplicateIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
  UserPlusIcon,
  DocumentTextIcon,
  CurrencyDollarIcon,
  CalendarDaysIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { 
  ExclamationCircleIcon as ExclamationCircleIconSolid,
  CheckCircleIcon as CheckCircleIconSolid 
} from '@heroicons/react/24/solid';

import { invoiceAPI, customerAPI, productAPI } from "../services/api";
import Button from "../components/ui/Button";
import InvoiceModal from "../components/billing/InvoiceModal"; // ADD THIS BACK
import CustomerModal from "../components/billing/CustomerModal";
import InvoiceDetailModal from "../components/billing/InvoiceDetailModal";

const Billing = () => {
  const [invoices, setInvoices] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Modal states
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [showCustomerModal, setShowCustomerModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState(null);
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');
  const [sortBy, setSortBy] = useState('invoice_date');
  const [sortOrder, setSortOrder] = useState('desc');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');

      const [invoicesRes, customersRes, productsRes] = await Promise.all([
        invoiceAPI.getAll().catch(() => ({ data: { results: [] } })),
        customerAPI.getAll().catch(() => ({ data: { results: [] } })),
        productAPI.getAll().catch(() => ({ data: { results: [] } }))
      ]);

      setInvoices(invoicesRes.data.results || invoicesRes.data || []);
      setCustomers(customersRes.data.results || customersRes.data || []);
      setProducts(productsRes.data.results || productsRes.data || []);

    } catch (error) {
      console.error('Error fetching billing data:', error);
      setError('Failed to load billing data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInvoice = () => {
    setSelectedInvoice(null);
    setShowInvoiceModal(true);
  };

  const handleViewInvoice = (invoice) => {
    if (!invoice || !invoice.id) {
      setError('Invoice data is not available');
      return;
    }
    setSelectedInvoice(invoice);
    setShowViewModal(true);
  };

  const handleEditInvoice = (invoice) => {
    if (!invoice) {
      setError('Invoice data is not available');
      return;
    }
    setSelectedInvoice(invoice);
    setShowInvoiceModal(true);
  };

  const handleDeleteInvoice = async (invoiceId) => {
    if (!invoiceId) return;
    
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      try {
        await invoiceAPI.delete(invoiceId);
        setInvoices(invoices.filter(inv => inv.id !== invoiceId));
        setSuccess('Invoice deleted successfully');
        setTimeout(() => setSuccess(''), 3000);
      } catch (error) {
        console.error('Error deleting invoice:', error);
        setError('Failed to delete invoice. Please try again.');
        setTimeout(() => setError(''), 5000);
      }
    }
  };

  const handleMarkPaid = async (invoiceId) => {
    if (!invoiceId) return;
    
    try {
      const updatedInvoice = await invoiceAPI.markPaid(invoiceId);
      setInvoices(invoices.map(inv => 
        inv.id === invoiceId ? { ...inv, status: 'paid', paid_date: new Date().toISOString().split('T')[0] } : inv
      ));
      setSuccess('Invoice marked as paid');
      setTimeout(() => setSuccess(''), 3000);
    } catch (error) {
      console.error('Error marking invoice as paid:', error);
      setError('Failed to mark invoice as paid. Please try again.');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleDuplicateInvoice = (invoice) => {
    if (!invoice) {
      setError('Invoice data is not available');
      return;
    }
    
    const duplicatedInvoice = {
      ...invoice,
      id: null,
      invoice_number: null,
      status: 'draft',
      invoice_date: new Date().toISOString().split('T')[0],
      due_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      paid_date: null,
      paid_amount: 0
    };
    setSelectedInvoice(duplicatedInvoice);
    setShowInvoiceModal(true);
  };

  // Filter and sort invoices
  const getFilteredInvoices = () => {
    let filtered = [...invoices];

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(invoice => 
        invoice.invoice_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        customers.find(c => c.id === invoice.customer)?.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(invoice => invoice.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== 'all') {
      const today = new Date();
      const filterDate = new Date();
      
      switch (dateFilter) {
        case 'today':
          filterDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(invoice => 
            new Date(invoice.invoice_date) >= filterDate
          );
          break;
        case 'week':
          filterDate.setDate(today.getDate() - 7);
          filtered = filtered.filter(invoice => 
            new Date(invoice.invoice_date) >= filterDate
          );
          break;
        case 'month':
          filterDate.setMonth(today.getMonth() - 1);
          filtered = filtered.filter(invoice => 
            new Date(invoice.invoice_date) >= filterDate
          );
          break;
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let aValue = a[sortBy];
      let bValue = b[sortBy];
      
      if (sortBy === 'customer') {
        aValue = customers.find(c => c.id === a.customer)?.name || '';
        bValue = customers.find(c => c.id === b.customer)?.name || '';
      }
      
      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }
      
      if (sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    return filtered;
  };

  const filteredInvoices = getFilteredInvoices();
  const totalPages = Math.ceil(filteredInvoices.length / itemsPerPage);
  const paginatedInvoices = filteredInvoices.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const formatCurrency = (amount) => {
    return `₹${Number(amount || 0).toLocaleString('en-IN')}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('en-IN', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status, dueDate) => {
    if (!status) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    const today = new Date().toISOString().split('T')[0];
    const isOverdue = (status === 'due' || status === 'partial') && dueDate && dueDate < today;
    
    if (isOverdue) {
      return 'bg-red-100 text-red-800 border-red-200';
    }
    
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 border-green-200';
      case 'partial': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'due': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'draft': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'paid': return <CheckCircleIconSolid className="w-4 h-4 text-green-600" />;
      case 'partial': return <ClockIcon className="w-4 h-4 text-yellow-600" />;
      case 'due': return <ExclamationCircleIconSolid className="w-4 h-4 text-blue-600" />;
      case 'draft': return <DocumentTextIcon className="w-4 h-4 text-gray-600" />;
      case 'cancelled': return <ExclamationTriangleIcon className="w-4 h-4 text-red-600" />;
      default: return <DocumentTextIcon className="w-4 h-4 text-gray-600" />;
    }
  };

  // Calculate summary stats
  const stats = {
    total: invoices.length,
    paid: invoices.filter(inv => inv.status === 'paid').length,
    due: invoices.filter(inv => inv.status === 'due').length,
    overdue: invoices.filter(inv => {
      const today = new Date().toISOString().split('T')[0];
      return (inv.status === 'due' || inv.status === 'partial') && inv.due_date < today;
    }).length,
    totalAmount: invoices.reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
    paidAmount: invoices.filter(inv => inv.status === 'paid').reduce((sum, inv) => sum + Number(inv.total_amount || 0), 0),
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Billing Data</h2>
          <p className="text-gray-500">Please wait while we fetch your invoices...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
                <DocumentTextIcon className="w-8 h-8 mr-3 text-green-600" />
                Billing & Invoicing
              </h1>
              <p className="text-gray-600">Create and manage invoices, track payments</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-3 mt-4 lg:mt-0">
              <Button 
                variant="outline" 
                onClick={() => fetchData()}
                className="flex items-center space-x-2"
                disabled={loading}
              >
                <ArrowPathIcon className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setShowCustomerModal(true)}
                className="flex items-center space-x-2"
              >
                <UserPlusIcon className="w-4 h-4" />
                <span>Add Customer</span>
              </Button>
              
              <Button 
                onClick={handleCreateInvoice}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
              >
                <PlusIcon className="w-4 h-4" />
                <span>Create Invoice</span>
              </Button>
            </div>
          </div>

          {/* Success/Error Messages */}
          {success && (
            <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-xl flex items-center">
              <CheckCircleIconSolid className="w-5 h-5 text-green-500 mr-3" />
              <span className="text-green-700">{success}</span>
            </div>
          )}

          {error && (
            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
              <ExclamationCircleIconSolid className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700">{error}</span>
            </div>
          )}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Invoices</p>
                <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <DocumentTextIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Paid Invoices</p>
                <p className="text-2xl font-bold text-green-600">{stats.paid}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Total Revenue</p>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="p-3 bg-green-100 rounded-xl">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{stats.overdue}</p>
              </div>
              <div className="p-3 bg-red-100 rounded-xl">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="relative">
                <MagnifyingGlassIcon className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search invoices..."
                  className="pl-10 pr-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <select
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="draft">Draft</option>
                <option value="due">Due</option>
                <option value="partial">Partial</option>
                <option value="paid">Paid</option>
                <option value="cancelled">Cancelled</option>
              </select>
              
              <select
                className="px-4 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Sort by:</span>
              <select
                className="px-3 py-2 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="invoice_date">Date</option>
                <option value="invoice_number">Invoice #</option>
                <option value="customer">Customer</option>
                <option value="total_amount">Amount</option>
                <option value="status">Status</option>
              </select>
              
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="p-2 border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                {sortOrder === 'asc' ? '↑' : '↓'}
              </button>
            </div>
          </div>
        </div>

        {/* Invoices Table */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Invoice #</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Customer</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Due Date</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Amount</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">Status</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedInvoices.length > 0 ? (
                  paginatedInvoices.map((invoice) => {
                    const customer = customers.find(c => c.id === invoice.customer);
                    return (
                      <tr key={invoice.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <span className="font-medium text-gray-900">
                            {invoice.invoice_number || `INV-${invoice.id}`}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-gray-900">
                            {customer ? customer.name : 'Unknown Customer'}
                          </span>
                          {customer && customer.email && (
                            <p className="text-sm text-gray-500">{customer.email}</p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {formatDate(invoice.invoice_date)}
                        </td>
                        <td className="px-6 py-4 text-gray-900">
                          {formatDate(invoice.due_date)}
                        </td>
                        <td className="px-6 py-4">
                          <span className="font-semibold text-gray-900">
                            {formatCurrency(invoice.total_amount)}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(invoice.status, invoice.due_date)}`}>
                            {getStatusIcon(invoice.status)}
                            <span className="ml-1 capitalize">
                              {invoice.status === 'due' && invoice.due_date < new Date().toISOString().split('T')[0] 
                                ? 'Overdue' 
                                : invoice.status}
                            </span>
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              onClick={() => handleViewInvoice(invoice)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="View Invoice"
                            >
                              <EyeIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleEditInvoice(invoice)}
                              className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"
                              title="Edit Invoice"
                            >
                              <PencilIcon className="w-4 h-4" />
                            </button>
                            
                            <button
                              onClick={() => handleDuplicateInvoice(invoice)}
                              className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                              title="Duplicate Invoice"
                            >
                              <DocumentDuplicateIcon className="w-4 h-4" />
                            </button>
                            
                            {invoice.status !== 'paid' && (
                              <button
                                onClick={() => handleMarkPaid(invoice.id)}
                                className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                title="Mark as Paid"
                              >
                                <CheckCircleIcon className="w-4 h-4" />
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleDeleteInvoice(invoice.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete Invoice"
                            >
                              <TrashIcon className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="px-6 py-12 text-center">
                      <div className="text-gray-400 text-4xl mb-4">📄</div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No invoices found</h3>
                      <p className="text-gray-500 mb-4">
                        {filteredInvoices.length === 0 && invoices.length > 0 
                          ? 'No invoices match your current filters.' 
                          : 'Get started by creating your first invoice.'}
                      </p>
                      <Button onClick={handleCreateInvoice} className="bg-green-600 hover:bg-green-700">
                        <PlusIcon className="w-4 h-4 mr-2" />
                        Create Invoice
                      </Button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="border-t border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="text-sm text-gray-700">
                  Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredInvoices.length)} of {filteredInvoices.length} results
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    const pageNum = Math.max(1, Math.min(totalPages - 4, currentPage - 2)) + i;
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`px-3 py-2 rounded-lg ${
                          currentPage === pageNum
                            ? 'bg-green-600 text-white'
                            : 'border border-gray-200 hover:bg-gray-50'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="px-3 py-2 border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Modals */}
      {showInvoiceModal && (
        <InvoiceModal
          invoice={selectedInvoice}
          customers={customers}
          products={products}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
          }}
          onSave={() => {
            setShowInvoiceModal(false);
            setSelectedInvoice(null);
            fetchData();
            setSuccess(selectedInvoice ? 'Invoice updated successfully' : 'Invoice created successfully');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {showCustomerModal && (
        <CustomerModal
          onClose={() => setShowCustomerModal(false)}
          onSave={() => {
            setShowCustomerModal(false);
            fetchData();
            setSuccess('Customer added successfully');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {showViewModal && selectedInvoice && (
        <InvoiceDetailModal
          invoice={selectedInvoice}
          customers={customers}
          onClose={() => {
            setShowViewModal(false);
            setSelectedInvoice(null);
          }}
          onEdit={() => {
            setShowViewModal(false);
            setShowInvoiceModal(true);
          }}
          onMarkPaid={(invoiceId) => {
            setShowViewModal(false);
            handleMarkPaid(invoiceId);
          }}
          onDuplicate={(invoice) => {
            setShowViewModal(false);
            handleDuplicateInvoice(invoice);
          }}
        />
      )}
    </div>
  );
};

export default Billing;