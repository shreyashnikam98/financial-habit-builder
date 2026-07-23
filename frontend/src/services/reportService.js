import api from './api';

export const reportService = {
  /**
   * Fetches data for reports
   * @param {string} type - 'income', 'expense', 'savings', 'goal', 'habit', 'investment'
   * @param {string} timeframe - 'weekly', 'monthly', 'yearly'
   * @param {string} [date] - Reference date in 'YYYY-MM-DD' format
   */
  getReportData: async (type, timeframe, date) => {
    const params = { type, timeframe };
    if (date) params.date = date;
    const res = await api.get('/reports', { params });
    return res.data;
  },
};
