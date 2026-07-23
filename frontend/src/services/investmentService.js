import API from './api';

export const investmentService = {
  // Get all investments with portfolio metrics & distribution chart
  getInvestments: async () => {
    const response = await API.get('/investments');
    return response.data;
  },

  // Get single investment record by ID
  getInvestmentById: async (id) => {
    const response = await API.get(`/investments/${id}`);
    return response.data;
  },

  // Create new investment entry
  createInvestment: async (investmentData) => {
    const response = await API.post('/investments', investmentData);
    return response.data;
  },

  // Update investment record
  updateInvestment: async (id, investmentData) => {
    const response = await API.put(`/investments/${id}`, investmentData);
    return response.data;
  },

  // Delete investment record
  deleteInvestment: async (id) => {
    const response = await API.delete(`/investments/${id}`);
    return response.data;
  },
};
