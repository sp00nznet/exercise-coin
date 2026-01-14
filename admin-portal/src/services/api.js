import axios from 'axios';

const api = axios.create({
  baseURL: '/api/admin'
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const adminApi = {
  // Auth
  login: (email, password) => api.post('/login', { email, password }),

  // Dashboard
  getDashboardStats: () => api.get('/dashboard'),

  // Transactions
  getTransactions: (params) => api.get('/transactions', { params }),

  // Transfers
  getTransfers: (params) => api.get('/transfers', { params }),

  // Friendly transfers
  getFriendlyTransfers: (params) => api.get('/friendly-transfers', { params }),

  // Treasure
  getTreasureDrops: (params) => api.get('/treasure/drops', { params }),
  getTreasureMapData: () => api.get('/treasure/map'),

  // Drop zones
  getDropZones: () => api.get('/drop-zones'),
  createDropZone: (data) => api.post('/drop-zones', data),
  updateDropZone: (id, data) => api.put(`/drop-zones/${id}`, data),
  deleteDropZone: (id) => api.delete(`/drop-zones/${id}`),

  // Users
  getUsers: (params) => api.get('/users', { params }),
  getUserDetails: (id) => api.get(`/users/${id}`),

  // Reports
  downloadTransactionReport: (params) =>
    api.get('/reports/transactions', { params, responseType: 'blob' }),
  downloadTransferReport: (params) =>
    api.get('/reports/transfers', { params, responseType: 'blob' }),
  downloadTreasureReport: (params) =>
    api.get('/reports/treasure', { params, responseType: 'blob' }),

  // Admin management
  createAdmin: (data) => api.post('/admins', data)
};

export default adminApi;
