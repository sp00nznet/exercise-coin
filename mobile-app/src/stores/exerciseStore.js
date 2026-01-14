import { create } from 'zustand';
import api from '../services/api';

export const useExerciseStore = create((set, get) => ({
  currentSession: null,
  isExercising: false,
  stepData: [],
  totalSteps: 0,
  elapsedSeconds: 0,
  sessions: [],
  stats: null,

  startSession: async () => {
    try {
      const response = await api.startExerciseSession();
      set({
        currentSession: {
          id: response.sessionId,
          startTime: response.startTime
        },
        isExercising: true,
        stepData: [],
        totalSteps: 0,
        elapsedSeconds: 0
      });
      return { success: true, sessionId: response.sessionId };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to start session'
      };
    }
  },

  recordSteps: async (stepDataBatch) => {
    const { currentSession, stepData } = get();
    if (!currentSession) return { success: false, error: 'No active session' };

    try {
      const response = await api.recordSteps(currentSession.id, stepDataBatch);

      const newStepData = [...stepData, ...stepDataBatch];
      set({
        stepData: newStepData,
        totalSteps: response.totalSteps
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to record steps'
      };
    }
  },

  addLocalStepData: (dataPoint) => {
    set((state) => ({
      stepData: [...state.stepData, dataPoint],
      totalSteps: state.totalSteps + dataPoint.stepCount,
      elapsedSeconds: state.elapsedSeconds + 1
    }));
  },

  endSession: async () => {
    const { currentSession } = get();
    if (!currentSession) return { success: false, error: 'No active session' };

    try {
      const response = await api.endExerciseSession(currentSession.id);

      set({
        currentSession: null,
        isExercising: false
      });

      return { success: true, session: response.session };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to end session'
      };
    }
  },

  cancelSession: () => {
    set({
      currentSession: null,
      isExercising: false,
      stepData: [],
      totalSteps: 0,
      elapsedSeconds: 0
    });
  },

  fetchSessions: async (limit = 20) => {
    try {
      const response = await api.getExerciseSessions(limit);
      set({ sessions: response.sessions });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch sessions'
      };
    }
  },

  fetchStats: async () => {
    try {
      const response = await api.getExerciseStats();
      set({ stats: response });
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error.response?.data?.error || 'Failed to fetch stats'
      };
    }
  },

  reset: () => {
    set({
      currentSession: null,
      isExercising: false,
      stepData: [],
      totalSteps: 0,
      elapsedSeconds: 0,
      sessions: [],
      stats: null
    });
  }
}));
