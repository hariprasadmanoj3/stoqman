import { useState, useEffect } from 'react';
import { 
  CubeIcon, 
  CurrencyDollarIcon,
  ExclamationTriangleIcon,
  UsersIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  ChartBarIcon,
  DocumentTextIcon,
  CalendarDaysIcon,
  EyeIcon,
  BellIcon,
  Cog6ToothIcon
} from '@heroicons/react/24/outline';
import { 
  CheckCircleIcon,
  ClockIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/solid';
import { productAPI, invoiceAPI, customerAPI } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';
import Button from '../components/ui/Button';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalProducts: 0,
    lowStockCount: 0,
    totalInvoices: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    paidInvoices: 0,
    pendingInvoices: 0,
    todaysRevenue: 0
  });
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [salesData, setSalesData] = useState([]);
  const [monthlyStats, setMonthlyStats] = useState([]);
  const [statusDistribution, setStatusDistribution] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(new Date());

  // User info from localStorage
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    fetchDashboardData();
    
    // Auto-refresh every 5 minutes
    const interval = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch all data concurrently
      const [
        productsRes,
        lowStockRes,
        invoicesRes,
        customersRes
      ] = await Promise.all([
        productAPI.getAll().catch(() => ({ data: { results: [] } })),
        productAPI.getLowStock().catch(() => ({ data: [] })),
        invoiceAPI.getAll().catch(() => ({ data: { results: [] } })),
        customerAPI.getAll().catch(() => ({ data: { results: [] } }))
      ]);

      // Process data
      const products = productsRes.data.results || productsRes.data || [];
      const lowStock = lowStockRes.data || [];
      const invoices = invoicesRes.data.results || invoicesRes.data || [];
      const customers = customersRes.data.results || customersRes.data || [];
      
      // Calculate stats
      const totalRevenue = invoices.reduce((sum, invoice) => sum + parseFloat(invoice.total || 0), 0);
      const paidInvoices = invoices.filter(inv => inv.status === 'paid').length;
      const pendingInvoices = invoices.filter(inv => inv.status === 'due' || inv.status === 'partial').length;
      
      // Today's revenue
      const today = new Date().toISOString().split('T')[0];
      const todaysInvoices = invoices.filter(inv => 
        new Date(inv.created_at).toISOString().split('T')[0] === today
      );
      const todaysRevenue = todaysInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);

      setStats({
        totalProducts: products.length,
        lowStockCount: lowStock.length,
        totalInvoices: invoices.length,
        totalRevenue,
        totalCustomers: customers.length,
        paidInvoices,
        pendingInvoices,
        todaysRevenue
      });

      setLowStockProducts(lowStock.slice(0, 5));
      setRecentInvoices(invoices.slice(0, 5));
      
      // Generate charts data
      generateSalesData(invoices);
      generateMonthlyStats(invoices);
      generateStatusDistribution(invoices);
      
      setLastUpdated(new Date());

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setError('Failed to load dashboard data. Please try refreshing the page.');
    } finally {
      setLoading(false);
    }
  };

  const generateSalesData = (invoices) => {
    // Last 7 days sales
    const last7Days = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayInvoices = invoices.filter(inv => 
        new Date(inv.created_at).toISOString().split('T')[0] === dateStr
      );
      
      const dayRevenue = dayInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
      
      last7Days.push({
        date: date.toLocaleDateString('en-US', { weekday: 'short' }),
        revenue: Math.round(dayRevenue),
        invoices: dayInvoices.length
      });
    }
    setSalesData(last7Days);
  };

  const generateMonthlyStats = (invoices) => {
    // Last 6 months
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStr = date.toISOString().slice(0, 7); // YYYY-MM
      
      const monthInvoices = invoices.filter(inv => 
        inv.created_at.slice(0, 7) === monthStr
      );
      
      const monthRevenue = monthInvoices.reduce((sum, inv) => sum + parseFloat(inv.total || 0), 0);
      
      months.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: Math.round(monthRevenue),
        invoices: monthInvoices.length
      });
    }
    setMonthlyStats(months);
  };

  const generateStatusDistribution = (invoices) => {
    const statusCount = invoices.reduce((acc, invoice) => {
      acc[invoice.status] = (acc[invoice.status] || 0) + 1;
      return acc;
    }, {});

    const colors = {
      paid: '#16a34a',
      partial: '#eab308',
      due: '#ef4444',
      draft: '#64748b',
      cancelled: '#dc2626'
    };

    const distribution = Object.entries(statusCount).map(([status, count]) => ({
      name: status.charAt(0).toUpperCase() + status.slice(1),
      value: count,
      color: colors[status] || '#64748b'
    }));

    setStatusDistribution(distribution);
  };

  const StatCard = ({ title, value, subtitle, icon: Icon, color, trend, trendValue, onClick }) => (
    <div 
      className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all duration-200 ${onClick ? 'cursor-pointer hover:scale-[1.02]' : ''}`}
      onClick={onClick}
    >
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        {trend && (
          <div className={`flex items-center text-sm font-medium ${trend === 'up' ? 'text-green-600' : 'text-red-500'}`}>
            {trend === 'up' ? (
              <ArrowTrendingUpIcon className="w-4 h-4 mr-1" />
            ) : (
              <ArrowTrendingDownIcon className="w-4 h-4 mr-1" />
            )}
            {trendValue}
          </div>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-gray-500 mb-1">{title}</h3>
        <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const formatCurrency = (amount) => {
    return `₹${Number(amount).toLocaleString('en-IN')}`;
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'partial': return 'bg-yellow-100 text-yellow-800';
      case 'due': return 'bg-red-100 text-red-800';
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading && stats.totalProducts === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-700 mb-2">Loading Dashboard</h2>
          <p className="text-gray-500">Fetching your business data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
      <div className="p-6 max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
            <div className="mb-4 lg:mb-0">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {getGreeting()}, {user.first_name || user.username || 'User'}! 👋
              </h1>
              <p className="text-gray-600 text-lg">
                Here's what's happening with your business today
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <ClockIcon className="w-4 h-4" />
                <span>Last updated: {lastUpdated.toLocaleTimeString()}</span>
              </div>
              <Button
                onClick={fetchDashboardData}
                variant="outline"
                size="sm"
                disabled={loading}
                className="flex items-center space-x-2"
              >
                <ArrowTrendingUpIcon className="w-4 h-4" />
                <span>Refresh</span>
              </Button>
            </div>
          </div>
          
          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center">
              <ExclamationCircleIcon className="w-5 h-5 text-red-500 mr-3" />
              <span className="text-red-700 text-sm">{error}</span>
            </div>
          )}
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Revenue"
            value={formatCurrency(stats.totalRevenue)}
            subtitle={`${stats.totalInvoices} invoices`}
            icon={CurrencyDollarIcon}
            color="bg-gradient-to-br from-green-500 to-emerald-600"
            trend="up"
            trendValue="+12%"
          />
          <StatCard
            title="Today's Sales"
            value={formatCurrency(stats.todaysRevenue)}
            subtitle="Today's earnings"
            icon={CalendarDaysIcon}
            color="bg-gradient-to-br from-blue-500 to-cyan-600"
            trend="up"
            trendValue="+8%"
          />
          <StatCard
            title="Total Products"
            value={stats.totalProducts}
            subtitle={`${stats.lowStockCount} low stock`}
            icon={CubeIcon}
            color="bg-gradient-to-br from-purple-500 to-indigo-600"
          />
          <StatCard
            title="Customers"
            value={stats.totalCustomers}
            subtitle="Active customers"
            icon={UsersIcon}
            color="bg-gradient-to-br from-orange-500 to-red-600"
            trend="up"
            trendValue="+5%"
          />
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Button 
            onClick={() => window.location.href = '/inventory'}
            className="py-3 bg-green-600 hover:bg-green-700"
          >
            <CubeIcon className="w-5 h-5 mr-2" />
            Manage Inventory
          </Button>
          <Button 
            onClick={() => window.location.href = '/billing'}
            className="py-3 bg-blue-600 hover:bg-blue-700"
          >
            <DocumentTextIcon className="w-5 h-5 mr-2" />
            Create Invoice
          </Button>
          <Button 
            onClick={() => window.location.href = '/billing'}
            variant="outline"
            className="py-3"
          >
            <UsersIcon className="w-5 h-5 mr-2" />
            Add Customer
          </Button>
          {((user.role || '').toLowerCase() === 'admin') && (
            <Button 
              onClick={() => window.location.href = '/reports'}
              variant="outline"
              className="py-3"
            >
              <ChartBarIcon className="w-5 h-5 mr-2" />
              View Reports
            </Button>
          )}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          
          {/* Sales Trend Chart */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Sales Trend (Last 7 Days)</h3>
              <div className="text-sm text-gray-500">Daily Revenue</div>
            </div>
            {salesData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} />
                  <YAxis stroke="#64748b" fontSize={12} />
                  <Tooltip 
                    formatter={(value) => [formatCurrency(value), 'Revenue']}
                    labelStyle={{ color: '#374151' }}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#16a34a" 
                    fill="url(#revenueGradient)"
                    strokeWidth={3}
                  />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <ChartBarIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No sales data available</p>
                </div>
              </div>
            )}
          </div>

          {/* Invoice Status Distribution */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Invoice Status</h3>
              <div className="text-sm text-gray-500">Current Distribution</div>
            </div>
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value) => [value, 'Invoices']}
                    contentStyle={{ 
                      backgroundColor: '#ffffff', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <DocumentTextIcon className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No invoice data available</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Low Stock Alerts */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                <ExclamationTriangleIcon className="w-5 h-5 text-orange-500 mr-2" />
                Low Stock Alerts
              </h3>
              <span className="bg-orange-100 text-orange-800 text-xs font-medium px-2.5 py-0.5 rounded-full">
                {stats.lowStockCount} items
              </span>
            </div>
            
            {lowStockProducts.length > 0 ? (
              <div className="space-y-4">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl hover:bg-orange-100 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-600">SKU: {product.sku}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-orange-700">
                        {product.stock_quantity} remaining
                      </p>
                      <p className="text-xs text-gray-500">
                        Min: {product.threshold}
                      </p>
                    </div>
                  </div>
                ))}
                <Button 
                  onClick={() => window.location.href = '/inventory'} 
                  variant="outline" 
                  className="w-full mt-4"
                >
                  Manage Inventory
                </Button>
              </div>
            ) : (
              <div className="text-center py-8">
                <CheckCircleIcon className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">All products are well stocked!</p>
                <p className="text-sm text-gray-400">No low stock alerts at this time</p>
              </div>
            )}
          </div>

          {/* Recent Invoices */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Recent Invoices</h3>
              <Button 
                onClick={() => window.location.href = '/billing'} 
                variant="outline" 
                size="sm"
              >
                <EyeIcon className="w-4 h-4 mr-1" />
                View All
              </Button>
            </div>
            
            {recentInvoices.length > 0 ? (
              <div className="space-y-4">
                {recentInvoices.map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">#{invoice.invoice_number}</p>
                      <p className="text-sm text-gray-600">{invoice.customer_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(invoice.created_at).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {formatCurrency(invoice.total)}
                      </p>
                      <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(invoice.status)}`}>
                        {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <DocumentTextIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No invoices yet</p>
                <p className="text-sm text-gray-400 mb-4">Create your first invoice to get started</p>
                <Button onClick={() => window.location.href = '/billing'}>
                  Create Invoice
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Monthly Performance (if data available) */}
        {monthlyStats.length > 0 && (
          <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">Monthly Performance</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="month" stroke="#64748b" fontSize={12} />
                <YAxis stroke="#64748b" fontSize={12} />
                <Tooltip 
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                  contentStyle={{ 
                    backgroundColor: '#ffffff', 
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#16a34a" 
                  strokeWidth={3}
                  dot={{ fill: '#16a34a', strokeWidth: 2, r: 6 }}
                  activeDot={{ r: 8, fill: '#16a34a' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;