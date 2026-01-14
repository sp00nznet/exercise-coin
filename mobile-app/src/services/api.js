import axios from 'axios';

const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api';

const client = axios.create({
  baseURL: API_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

const api = {
  setAuthToken: (token) => {
    if (token) {
      client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    } else {
      delete client.defaults.headers.common['Authorization'];
    }
  },

  // Auth
  login: async (email, password) => {
    const response = await client.post('/auth/login', { email, password });
    return response.data;
  },

  register: async (email, password, username) => {
    const response = await client.post('/auth/register', { email, password, username });
    return response.data;
  },

  getProfile: async () => {
    const response = await client.get('/auth/profile');
    return response.data;
  },

  logout: async () => {
    const response = await client.post('/auth/logout');
    return response.data;
  },

  // Exercise
  startExerciseSession: async () => {
    const response = await client.post('/exercise/session/start');
    return response.data;
  },

  recordSteps: async (sessionId, stepData) => {
    const response = await client.post('/exercise/session/steps', {
      sessionId,
      stepData
    });
    return response.data;
  },

  endExerciseSession: async (sessionId) => {
    const response = await client.post('/exercise/session/end', { sessionId });
    return response.data;
  },

  getExerciseSessions: async (limit = 20, offset = 0) => {
    const response = await client.get('/exercise/sessions', {
      params: { limit, offset }
    });
    return response.data;
  },

  getExerciseSession: async (sessionId) => {
    const response = await client.get(`/exercise/session/${sessionId}`);
    return response.data;
  },

  getExerciseStats: async () => {
    const response = await client.get('/exercise/stats');
    return response.data;
  },

  // Wallet
  getWalletBalance: async () => {
    const response = await client.get('/wallet/balance');
    return response.data;
  },

  getWalletAddress: async () => {
    const response = await client.get('/wallet/address');
    return response.data;
  },

  getTransactions: async (limit = 50, offset = 0) => {
    const response = await client.get('/wallet/transactions', {
      params: { limit, offset }
    });
    return response.data;
  },

  getDaemonStatus: async () => {
    const response = await client.get('/wallet/daemon/status');
    return response.data;
  },

  startDaemon: async () => {
    const response = await client.post('/wallet/daemon/start');
    return response.data;
  },

  getEarningsHistory: async (days = 30) => {
    const response = await client.get('/wallet/earnings', { params: { days } });
    return response.data;
  },

  // User
  getDashboard: async () => {
    const response = await client.get('/user/dashboard');
    return response.data;
  },

  updateProfile: async (data) => {
    const response = await client.put('/user/profile', data);
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await client.put('/user/password', {
      currentPassword,
      newPassword
    });
    return response.data;
  },

  getLeaderboard: async (period = 'all', limit = 10) => {
    const response = await client.get('/user/leaderboard', {
      params: { period, limit }
    });
    return response.data;
  },

  // Achievements
  getAchievements: async () => {
    const response = await client.get('/achievements');
    return response.data;
  },

  checkAchievements: async () => {
    const response = await client.post('/achievements/check');
    return response.data;
  },

  getNewAchievements: async () => {
    const response = await client.get('/achievements/new');
    return response.data;
  }
};

export default api;
