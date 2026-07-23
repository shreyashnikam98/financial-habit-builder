import api from './api';

export const goalService = {
  getGoals: async () => {
    const res = await api.get('/goals');
    return res.data;
  },

  createGoal: async (goalData) => {
    const res = await api.post('/goals', goalData);
    return res.data;
  },

  updateGoal: async (id, goalData) => {
    const res = await api.put(`/goals/${id}`, goalData);
    return res.data;
  },

  contributeGoal: async (id, amount) => {
    const res = await api.post(`/goals/${id}/contribute`, { amount });
    return res.data;
  },

  sendReminder: async (id) => {
    const res = await api.post(`/goals/${id}/reminder`);
    return res.data;
  },

  deleteGoal: async (id) => {
    const res = await api.delete(`/goals/${id}`);
    return res.data;
  },
};

export const wealthService = {
  getWealthAssets: async () => {
    const res = await api.get('/wealth');
    return res.data;
  },

  createWealthAsset: async (assetData) => {
    const res = await api.post('/wealth', assetData);
    return res.data;
  },

  deleteWealthAsset: async (id) => {
    const res = await api.delete(`/wealth/${id}`);
    return res.data;
  },
};

export const analyticsService = {
  getDashboardAnalytics: async () => {
    const res = await api.get('/analytics/dashboard');
    return res.data;
  },
};
