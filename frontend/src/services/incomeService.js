import API from './api';

export const incomeService = {
  // Get income history with search, filter, and pagination
  getIncomes: async (params = {}) => {
    const response = await API.get('/incomes', { params });
    return response.data;
  },

  // Get single income record by ID
  getIncomeById: async (id) => {
    const response = await API.get(`/incomes/${id}`);
    return response.data;
  },

  // Create new income record
  createIncome: async (incomeData) => {
    const response = await API.post('/incomes', incomeData);
    return response.data;
  },

  // Update existing income record
  updateIncome: async (id, incomeData) => {
    const response = await API.put(`/incomes/${id}`, incomeData);
    return response.data;
  },

  // Delete income record
  deleteIncome: async (id) => {
    const response = await API.delete(`/incomes/${id}`);
    return response.data;
  },
};
