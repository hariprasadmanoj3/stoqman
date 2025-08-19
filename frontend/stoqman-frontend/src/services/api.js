import axios from 'axios';

const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const response = await axios.post(`${API_BASE_URL}/auth/refresh/`, {
            refresh: refreshToken,
          });
          const newToken = response.data.access;
          localStorage.setItem('access_token', newToken);
          
          // Retry the original request
          error.config.headers.Authorization = `Bearer ${newToken}`;
          return axios.request(error.config);
        } catch (refreshError) {
          localStorage.removeItem('access_token');
          localStorage.removeItem('refresh_token');
          localStorage.removeItem('user');
          window.location.href = '/login';
        }
      } else {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials) => api.post('/auth/login/', credentials),
  refresh: (refreshToken) => api.post('/auth/refresh/', { refresh: refreshToken }),
};

// User API
export const userAPI = {
  getProfile: () => api.get('/users/me/'),
  updateProfile: (data) => api.patch('/users/me/', data),
  getAll: () => api.get('/users/'),
  create: (data) => api.post('/users/', data),
  update: (id, data) => api.patch(`/users/${id}/`, data),
  delete: (id) => api.delete(`/users/${id}/`),
};

// Product API
export const productAPI = {
  getAll: () => api.get('/products/'),
  get: (id) => api.get(`/products/${id}/`),
  create: (data) => api.post('/products/', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  update: (id, data) => api.patch(`/products/${id}/`, data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  delete: (id) => api.delete(`/products/${id}/`),
  getLowStock: () => api.get('/products/low_stock/'),
  getOutOfStock: () => api.get('/products/out_of_stock/'),
  bulkUpdate: (data) => api.post('/products/bulk_update/', data),
  // Axios DELETE needs the payload under config.data
  bulkDelete: (data) => api.delete('/products/bulk_delete/', { data }),
};

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories/'),
  get: (id) => api.get(`/categories/${id}/`),
  create: (data) => api.post('/categories/', data),
  update: (id, data) => api.patch(`/categories/${id}/`, data),
  delete: (id) => api.delete(`/categories/${id}/`),
};

// Customer API
export const customerAPI = {
  getAll: () => api.get('/customers/'),
  get: (id) => api.get(`/customers/${id}/`),
  create: (data) => api.post('/customers/', data),
  update: (id, data) => api.patch(`/customers/${id}/`, data),
  delete: (id) => api.delete(`/customers/${id}/`),
};

// Update the invoice API section
export const invoiceAPI = {
  getAll: () => api.get('/invoices/'),
  get: (id) => api.get(`/invoices/${id}/`),
  create: (data) => api.post('/invoices/', data),
  update: (id, data) => api.patch(`/invoices/${id}/`, data),
  delete: (id) => api.delete(`/invoices/${id}/`),
  markPaid: (id) => api.post(`/invoices/${id}/mark_paid/`),
  partialPayment: (id, data) => api.post(`/invoices/${id}/partial_payment/`, data),
  getPending: () => api.get('/invoices/pending/'),
  getOverdue: () => api.get('/invoices/overdue/'),
  
  // Updated invoice item methods
  addItem: (invoiceId, data) => api.post(`/invoices/${invoiceId}/add_item/`, data),
  removeItem: (invoiceId, data) => api.delete(`/invoices/${invoiceId}/remove_item/`, { data }),
  
  // Invoice Items CRUD
  createItem: (data) => api.post('/invoice-items/', data),
  updateItem: (id, data) => api.patch(`/invoice-items/${id}/`, data),
  deleteItem: (id) => api.delete(`/invoice-items/${id}/`),
};

// Reports API
export const reportsAPI = {
  getSalesSummary: (params) => api.get('/reports/sales_summary/', { params }),
  getInventorySummary: () => api.get('/reports/inventory_summary/'),
};

export default api;