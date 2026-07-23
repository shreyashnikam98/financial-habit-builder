import api from './api';

export const transactionService = {
  getTransactions: async (params) => {
    const res = await api.get('/transactions', { params });
    return res.data;
  },

  createTransaction: async (formData) => {
    const isFormData = formData instanceof FormData;
    const res = await api.post('/transactions', formData, {
      headers: isFormData ? { 'Content-Type': 'multipart/form-data' } : {},
    });
    return res.data;
  },

  deleteTransaction: async (id) => {
    const res = await api.delete(`/transactions/${id}`);
    return res.data;
  },
};
