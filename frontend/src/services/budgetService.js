import API from './api';

export const budgetService = {
  // Get budgets with monthly spending metrics and alerts
  getBudgets: async (params = {}) => {
    const response = await API.get('/budgets', { params });
    return response.data;
  },

  // Get single budget by ID
  getBudgetById: async (id) => {
    const response = await API.get(`/budgets/${id}`);
    return response.data;
  },

  // Create new category budget
  createBudget: async (budgetData) => {
    const response = await API.post('/budgets', budgetData);
    return response.data;
  },

  // Update budget limit or category
  updateBudget: async (id, budgetData) => {
    const response = await API.put(`/budgets/${id}`, budgetData);
    return response.data;
  },

  // Delete category budget
  deleteBudget: async (id) => {
    const response = await API.delete(`/budgets/${id}`);
    return response.data;
  },

  // Get budget analytics chart data
  getBudgetAnalytics: async () => {
    const response = await API.get('/budgets/analytics');
    return response.data;
  },
};
