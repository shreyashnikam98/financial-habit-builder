import Goal from '../models/Goal.js';
import sendEmail from '../utils/sendEmail.js';

// @desc    Get all goals for user
// @route   GET /api/goals
// @access  Private
export const getGoals = async (req, res) => {
  try {
    const userId = req.user._id;
    const goals = await Goal.find({
      $or: [{ userId }, { user: userId }],
    }).sort({ deadline: 1, targetDate: 1 });

    // Auto-update overdue status if deadline passed and not achieved
    const now = new Date();
    for (const g of goals) {
      const dDate = g.deadline || g.targetDate;
      const saved = g.savedAmount ?? g.currentAmount ?? 0;
      if (dDate && new Date(dDate) < now && saved < g.targetAmount && g.status === 'In Progress') {
        g.status = 'Overdue';
        await g.save();
      }
    }

    res.json({ success: true, count: goals.length, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new financial goal
// @route   POST /api/goals
// @access  Private
export const createGoal = async (req, res) => {
  try {
    const { goalName, title, targetAmount, savedAmount, currentAmount, deadline, targetDate, reminderEnabled } = req.body;

    const finalName = goalName || title;
    const finalTarget = Number(targetAmount);
    const finalSaved = Number(savedAmount ?? currentAmount ?? 0);
    const finalDeadline = deadline || targetDate;

    if (!finalName || !finalTarget || !finalDeadline) {
      return res.status(400).json({
        success: false,
        message: 'Goal name, target amount, and deadline date are required',
      });
    }

    const status = finalSaved >= finalTarget ? 'Achieved' : (new Date(finalDeadline) < new Date() ? 'Overdue' : 'In Progress');

    const goal = await Goal.create({
      userId: req.user._id,
      goalName: finalName,
      targetAmount: finalTarget,
      savedAmount: finalSaved,
      deadline: new Date(finalDeadline),
      status,
      reminderEnabled: reminderEnabled !== undefined ? reminderEnabled : true,
    });

    res.status(201).json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Contribute to goal
// @route   POST /api/goals/:id/contribute
// @access  Private
export const contributeToGoal = async (req, res) => {
  try {
    const { amount } = req.body;
    if (!amount || Number(amount) <= 0) {
      return res.status(400).json({ success: false, message: 'Contribution amount must be positive' });
    }

    const userId = req.user._id;
    const goal = await Goal.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const newSaved = (goal.savedAmount ?? goal.currentAmount ?? 0) + Number(amount);
    goal.savedAmount = newSaved;
    goal.currentAmount = newSaved;

    if (goal.savedAmount >= goal.targetAmount) {
      goal.status = 'Achieved';
    }

    await goal.save();
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Send goal email reminder
// @route   POST /api/goals/:id/reminder
// @access  Private
export const sendGoalReminder = async (req, res) => {
  try {
    const userId = req.user._id;
    const goal = await Goal.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    const userEmail = req.user.email;
    const goalTitle = goal.goalName || goal.title;
    const target = goal.targetAmount;
    const saved = goal.savedAmount ?? goal.currentAmount ?? 0;
    const pct = Math.round((saved / target) * 100);

    const message = `
      Hi ${req.user.name},
      This is a friendly reminder for your financial goal: "${goalTitle}".
      Current Progress: $${saved.toLocaleString()} / $${target.toLocaleString()} (${pct}% achieved).
      Deadline: ${new Date(goal.deadline || goal.targetDate).toLocaleDateString()}.
      Keep making steady contributions to build long-term wealth!
    `;

    try {
      await sendEmail({
        email: userEmail,
        subject: `Financial Goal Reminder: ${goalTitle}`,
        message,
      });
      res.json({ success: true, message: `Reminder email sent to ${userEmail}` });
    } catch (mailErr) {
      res.json({ success: true, message: `Reminder active. Current progress: ${pct}%` });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update goal details
// @route   PUT /api/goals/:id
// @access  Private
export const updateGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const goal = await Goal.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    goal.goalName = req.body.goalName || req.body.title || goal.goalName;
    goal.targetAmount = req.body.targetAmount !== undefined ? Number(req.body.targetAmount) : goal.targetAmount;
    
    if (req.body.savedAmount !== undefined || req.body.currentAmount !== undefined) {
      const s = Number(req.body.savedAmount ?? req.body.currentAmount);
      goal.savedAmount = s;
      goal.currentAmount = s;
    }

    if (req.body.deadline || req.body.targetDate) {
      const d = new Date(req.body.deadline || req.body.targetDate);
      goal.deadline = d;
      goal.targetDate = d;
    }

    if (req.body.status) {
      goal.status = req.body.status;
    }

    if (req.body.reminderEnabled !== undefined) {
      goal.reminderEnabled = req.body.reminderEnabled;
    }

    const currentSaved = goal.savedAmount ?? goal.currentAmount ?? 0;
    if (currentSaved >= goal.targetAmount) {
      goal.status = 'Achieved';
    }

    const updated = await goal.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete goal
// @route   DELETE /api/goals/:id
// @access  Private
export const deleteGoal = async (req, res) => {
  try {
    const userId = req.user._id;
    const goal = await Goal.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!goal) {
      return res.status(404).json({ success: false, message: 'Goal not found' });
    }

    res.json({ success: true, message: 'Goal deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
