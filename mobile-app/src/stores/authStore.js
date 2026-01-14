import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import api from '../services/api';

const TOKEN_KEY = 'exercise_coin_token';
const USER_KEY = 'exercise_coin_user';

export const useAuthStore = create((set, get) => ({
  token: null,
  user: null,
  isLoading: true,

  initialize: async () => {
    try {
      const token = await SecureStore.getItemAsync(TOKEN_KEY);
      const userStr = await SecureStore.getItemAsync(USER_KEY);

      if (token && userStr) {
        const user = JSON.parse(userStr);
        api.setAuthToken(token);
        set({ token, user, isLoading: false });

        // Verify token is still valid
        try {
          const response = await api.getProfile();
          set({ user: response.user });
        } catch (error) {
          // Token invalid, clear auth
          await get().logout();
        }
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to initialize auth:', error);
      set({ isLoading: false });
    }
  },

  login: async (email, password) => {
    try {
      const response = await api.login(email, password);

      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      api.setAuthToken(response.token);
      set({ token: response.token, user: response.user });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Login failed'
      };
    }
  },

  register: async (email, password, username) => {
    try {
      const response = await api.register(email, password, username);

      await SecureStore.setItemAsync(TOKEN_KEY, response.token);
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(response.user));

      api.setAuthToken(response.token);
      set({ token: response.token, user: response.user });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Registration failed'
      };
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(TOKEN_KEY);
      await SecureStore.deleteItemAsync(USER_KEY);
    } catch (error) {
      console.error('Failed to clear secure store:', error);
    }

    api.setAuthToken(null);
    set({ token: null, user: null });
  },

  updateUser: async (userData) => {
    const updatedUser = { ...get().user, ...userData };
    set({ user: updatedUser });
    try {
      await SecureStore.setItemAsync(USER_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Failed to persist user update:', error);
    }
  }
}));

// Initialize on import
useAuthStore.getState().initialize();
