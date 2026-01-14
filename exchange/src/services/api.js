import axios from 'axios';

// User API (requires user auth token)
const userApi = axios.create({
  baseURL: '/api/exchange'
});

userApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Admin API (requires admin auth token)
const adminApi = axios.create({
  baseURL: '/api/exchange/admin'
});

adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
[userApi, adminApi].forEach(api => {
  api.interceptors.response.use(
    (response) => response,
    (error) => {
      if (error.response?.status === 401) {
        // Clear tokens on auth error
        if (api === adminApi) {
          localStorage.removeItem('adminToken');
        }
      }
      return Promise.reject(error);
    }
  );
});

// Public exchange API (no auth needed)
export const publicApi = {
  getCurrencies: () => axios.get('/api/exchange/currencies'),
  getRate: (currency) => axios.get(`/api/exchange/rate/${currency}`)
};

// User exchange API
export const exchangeApi = {
  // Orders
  getOrders: (params) => userApi.get('/user/orders', { params }),
  createBuyOrder: (data) => userApi.post('/user/buy', data),
  createSellOrder: (data) => userApi.post('/user/sell', data),
  cancelOrder: (orderId) => userApi.delete(`/user/orders/${orderId}`)
};

// Admin exchange API
export const exchangeAdminApi = {
  // Auth
  login: (email, password) => axios.post('/api/admin/login', { email, password }),

  // Wallets
  getWallets: () => adminApi.get('/wallets'),
  upsertWallet: (data) => adminApi.post('/wallets', data),
  updateRate: (currency, exchangeRate) => adminApi.put(`/rate/${currency}`, { exchangeRate }),
  deleteWallet: (currency) => adminApi.delete(`/wallets/${currency}`),

  // Orders
  getOrders: (params) => adminApi.get('/orders', { params }),
  processOrder: (orderId, data) => adminApi.post(`/orders/${orderId}/process`, data)
};

export default { publicApi, exchangeApi, exchangeAdminApi };
