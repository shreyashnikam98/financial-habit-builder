import api from './api';

export const notificationService = {
  /**
   * Fetch notifications list
   * @param {boolean} [unreadOnly=false]
   */
  getNotifications: async (unreadOnly = false) => {
    const res = await api.get('/notifications', { params: { unreadOnly } });
    return res.data;
  },

  /**
   * Run automated trigger engine on server to generate new alerts
   */
  checkTriggers: async () => {
    const res = await api.post('/notifications/check-triggers');
    return res.data;
  },

  /**
   * Mark a notification as read
   * @param {string} id
   */
  markAsRead: async (id) => {
    const res = await api.put(`/notifications/${id}/read`);
    return res.data;
  },

  /**
   * Mark all notifications as read
   */
  markAllAsRead: async () => {
    const res = await api.put('/notifications/read-all');
    return res.data;
  },

  /**
   * Delete single notification
   * @param {string} id
   */
  deleteNotification: async (id) => {
    const res = await api.delete(`/notifications/${id}`);
    return res.data;
  },

  /**
   * Clear all notifications
   */
  clearAll: async () => {
    const res = await api.delete('/notifications/clear-all');
    return res.data;
  },
};
