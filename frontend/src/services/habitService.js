import api from './api';

export const habitService = {
  getHabits: async () => {
    const res = await api.get('/habits');
    return res.data;
  },

  createHabit: async (habitData) => {
    const res = await api.post('/habits', habitData);
    return res.data;
  },

  toggleHabit: async (id, date) => {
    const res = await api.post(`/habits/${id}/toggle`, { date });
    return res.data;
  },

  updateHabit: async (id, habitData) => {
    const res = await api.put(`/habits/${id}`, habitData);
    return res.data;
  },

  deleteHabit: async (id) => {
    const res = await api.delete(`/habits/${id}`);
    return res.data;
  },
};
