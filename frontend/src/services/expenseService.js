import API from './api';

export const expenseService = {
  // Get expense records with search, filter, and pagination
  getExpenses: async (params = {}) => {
    const response = await API.get('/expenses', { params });
    return response.data;
  },

  // Get single expense record by ID
  getExpenseById: async (id) => {
    const response = await API.get(`/expenses/${id}`);
    return response.data;
  },

  // Create new expense record
  createExpense: async (expenseData) => {
    const response = await API.post('/expenses', expenseData);
    return response.data;
  },

  // Update existing expense record
  updateExpense: async (id, expenseData) => {
    const response = await API.put(`/expenses/${id}`, expenseData);
    return response.data;
  },

  // Delete expense record
  deleteExpense: async (id) => {
    const response = await API.delete(`/expenses/${id}`);
    return response.data;
  },

  // Get expense reports (category breakdown & monthly totals)
  getExpenseReports: async () => {
    const response = await API.get('/expenses/reports');
    return response.data;
  },
};
