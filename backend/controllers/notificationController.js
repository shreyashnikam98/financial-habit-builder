import Notification from '../models/Notification.js';
import Budget from '../models/Budget.js';
import Goal from '../models/Goal.js';
import Habit from '../models/Habit.js';
import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Transaction from '../models/Transaction.js';

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
export const getNotifications = async (req, res) => {
  try {
    const userId = req.user._id;
    const { unreadOnly } = req.query;

    const query = { userId };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(50);

    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark a single notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
export const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user._id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json({
      success: true,
      unreadCount,
      data: notification,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark all user notifications as read
// @route   PUT /api/notifications/read-all
// @access  Private
export const markAllAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    );

    res.json({
      success: true,
      message: 'All notifications marked as read',
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a notification
// @route   DELETE /api/notifications/:id
// @access  Private
export const deleteNotification = async (req, res) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    const unreadCount = await Notification.countDocuments({ userId: req.user._id, read: false });

    res.json({
      success: true,
      message: 'Notification deleted',
      unreadCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Clear all notifications
// @route   DELETE /api/notifications/clear-all
// @access  Private
export const clearAllNotifications = async (req, res) => {
  try {
    await Notification.deleteMany({ userId: req.user._id });

    res.json({
      success: true,
      message: 'All notifications cleared',
      unreadCount: 0,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Automated Trigger Engine: Evaluates user data and auto-generates system notifications
// @route   POST /api/notifications/check-triggers
// @access  Private
export const checkAndGenerateTriggers = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    const newCreatedNotifications = [];

    // Helper to prevent duplicate recent notifications
    const shouldCreate = async (type, linkKey, cooldownHours = 12) => {
      const recentCutoff = new Date(Date.now() - cooldownHours * 60 * 60 * 1000);
      const existing = await Notification.findOne({
        userId,
        type,
        link: linkKey,
        createdAt: { $gte: recentCutoff },
      });
      return !existing;
    };

    // 1. Check TRIGGER: Budget Exceeded
    const budgets = await Budget.find({ userId });
    for (const b of budgets) {
      if (b.spent > b.budget) {
        const canNotify = await shouldCreate('budget_exceeded', '/budgets', 12);
        if (canNotify) {
          const excess = b.spent - b.budget;
          const notif = await Notification.create({
            userId,
            title: `Budget Limit Exceeded: ${b.category}`,
            message: `You have spent $${b.spent.toLocaleString()} on ${b.category}, exceeding your limit of $${b.budget.toLocaleString()} by $${excess.toLocaleString()}.`,
            type: 'budget_exceeded',
            link: '/budgets',
          });
          newCreatedNotifications.push(notif);
        }
      }
    }

    // 2. Check TRIGGER: Goal Deadline
    const goals = await Goal.find({ userId, status: 'In Progress' });
    for (const g of goals) {
      const deadlineDate = new Date(g.deadline);
      const diffTime = deadlineDate - now;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays <= 3) {
        const canNotify = await shouldCreate('goal_deadline', `/goals#${g._id}`, 24);
        if (canNotify) {
          const isOverdue = diffDays < 0;
          const notif = await Notification.create({
            userId,
            title: isOverdue ? `Goal Overdue: ${g.goalName}` : `Goal Deadline Approaching: ${g.goalName}`,
            message: isOverdue 
              ? `Your goal "${g.goalName}" target date passed on ${deadlineDate.toLocaleDateString()}. Saved: $${g.savedAmount} / $${g.targetAmount}.`
              : `Your goal "${g.goalName}" is due in ${diffDays} day(s) on ${deadlineDate.toLocaleDateString()}. Saved: $${g.savedAmount} / $${g.targetAmount}.`,
            type: 'goal_deadline',
            link: '/goals',
          });
          newCreatedNotifications.push(notif);
        }
      }
    }

    // 3. Check TRIGGER: Daily Habit Reminder
    const habits = await Habit.find({ userId });
    const pendingToday = habits.filter(h => !h.completedDays?.includes(todayStr));
    if (pendingToday.length > 0) {
      const canNotify = await shouldCreate('habit_reminder', '/habits', 18);
      if (canNotify) {
        const notif = await Notification.create({
          userId,
          title: 'Daily Habit Reminder',
          message: `You have ${pendingToday.length} habit routine(s) pending for check-in today! Stay on track.`,
          type: 'habit_reminder',
          link: '/habits',
        });
        newCreatedNotifications.push(notif);
      }
    }

    // 4. Check TRIGGER: Savings Reminder
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [incomes, expenses, transactions] = await Promise.all([
      Income.find({ userId, date: { $gte: startOfMonth } }),
      Expense.find({ userId, date: { $gte: startOfMonth } }),
      Transaction.find({ user: userId, date: { $gte: startOfMonth } }),
    ]);

    const totalInc = incomes.reduce((s, i) => s + i.amount, 0) +
      transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

    const totalExp = expenses.reduce((s, e) => s + e.amount, 0) +
      transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

    const netSavings = totalInc - totalExp;
    const savingsRate = totalInc > 0 ? (netSavings / totalInc) * 100 : 0;

    if (totalInc > 0 && savingsRate < 20) {
      const canNotify = await shouldCreate('savings_reminder', '/reports', 24);
      if (canNotify) {
        const notif = await Notification.create({
          userId,
          title: 'Savings Performance Alert',
          message: `Your monthly savings rate is currently ${Math.round(savingsRate)}%. Consider transferring leftover funds to your savings or investment accounts.`,
          type: 'savings_reminder',
          link: '/reports',
        });
        newCreatedNotifications.push(notif);
      }
    }

    // 5. Check TRIGGER: Monthly Report Ready
    const canNotifyReport = await shouldCreate('monthly_report_ready', '/reports', 48);
    if (canNotifyReport) {
      const monthName = now.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
      const notif = await Notification.create({
        userId,
        title: 'Monthly Financial Report Ready',
        message: `Your detailed analytics report for ${monthName} is compiled and ready for review.`,
        type: 'monthly_report_ready',
        link: '/reports',
      });
      newCreatedNotifications.push(notif);
    }

    // Fetch updated list of notifications
    const notifications = await Notification.find({ userId }).sort({ createdAt: -1 }).limit(50);
    const unreadCount = await Notification.countDocuments({ userId, read: false });

    res.json({
      success: true,
      newTriggersCount: newCreatedNotifications.length,
      newCreatedNotifications,
      unreadCount,
      data: notifications,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
