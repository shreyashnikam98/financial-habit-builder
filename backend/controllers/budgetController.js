import Budget from '../models/Budget.js';
import Expense from '../models/Expense.js';

// @desc    Get all budgets for user with dynamic spent calculation & alerts
// @route   GET /api/budgets
// @access  Private
export const getBudgets = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    const currentMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    // Query budgets matching month and year
    const budgets = await Budget.find({
      $or: [{ userId }, { user: userId }],
      month: currentMonth,
      year: currentYear,
    }).sort({ createdAt: -1 });

    // Start & End of the target month for expenses calculation
    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    // Aggregate expenses by category for current month
    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $toLower: '$category' },
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const expenseMap = {};
    expensesByCategory.forEach((item) => {
      expenseMap[item._id] = item.totalSpent;
    });

    // Process budgets with real-time spent & alerts
    let totalMonthlyBudget = 0;
    let totalMonthlySpent = 0;
    const alerts = [];

    const processedBudgets = budgets.map((b) => {
      const catLower = b.category.toLowerCase();
      const actualSpent = expenseMap[catLower] || b.spent || 0;
      const budgetLimit = b.budget;
      const remaining = Math.max(0, budgetLimit - actualSpent);
      const usagePct = budgetLimit > 0 ? Math.round((actualSpent / budgetLimit) * 100) : 0;

      totalMonthlyBudget += budgetLimit;
      totalMonthlySpent += actualSpent;

      // Budget alert conditions
      if (usagePct >= 100) {
        alerts.push({
          type: 'danger',
          category: b.category,
          message: `Budget Exceeded! You spent $${actualSpent.toLocaleString()} of your $${budgetLimit.toLocaleString()} ${b.category} budget (${usagePct}%).`,
        });
      } else if (usagePct >= 80) {
        alerts.push({
          type: 'warning',
          category: b.category,
          message: `Warning: You have reached ${usagePct}% ($${actualSpent.toLocaleString()}) of your ${b.category} budget.`,
        });
      }

      return {
        _id: b._id,
        category: b.category,
        budget: budgetLimit,
        spent: actualSpent,
        remaining,
        usagePct,
        month: b.month,
        year: b.year,
        createdAt: b.createdAt,
      };
    });

    const totalRemaining = Math.max(0, totalMonthlyBudget - totalMonthlySpent);

    res.json({
      success: true,
      data: processedBudgets,
      summary: {
        totalMonthlyBudget,
        totalMonthlySpent,
        totalRemaining,
        month: currentMonth,
        year: currentYear,
      },
      alerts,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a category budget
// @route   POST /api/budgets
// @access  Private
export const createBudget = async (req, res) => {
  try {
    const { category, budget, month, year } = req.body;

    if (!category || budget === undefined || budget === null) {
      return res.status(400).json({
        success: false,
        message: 'Category and budget limit are required',
      });
    }

    const bMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    const bYear = year ? parseInt(year) : new Date().getFullYear();

    // Check if budget already exists for this category and period
    let existingBudget = await Budget.findOne({
      userId: req.user._id,
      category: { $regex: `^${category}$`, $options: 'i' },
      month: bMonth,
      year: bYear,
    });

    if (existingBudget) {
      existingBudget.budget = Number(budget);
      await existingBudget.save();
      return res.json({
        success: true,
        message: 'Existing budget limit updated',
        data: existingBudget,
      });
    }

    const newBudget = await Budget.create({
      userId: req.user._id,
      category,
      budget: Number(budget),
      month: bMonth,
      year: bYear,
    });

    res.status(201).json({
      success: true,
      message: 'Category budget created successfully',
      data: newBudget,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single budget record
// @route   GET /api/budgets/:id
// @access  Private
export const getBudgetById = async (req, res) => {
  try {
    const budget = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget record not found' });
    }

    res.json({ success: true, data: budget });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update budget limit or category
// @route   PUT /api/budgets/:id
// @access  Private
export const updateBudget = async (req, res) => {
  try {
    const { category, budget } = req.body;

    let bRecord = await Budget.findOne({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!bRecord) {
      return res.status(404).json({ success: false, message: 'Budget record not found' });
    }

    if (budget !== undefined && Number(budget) < 0) {
      return res.status(400).json({ success: false, message: 'Budget limit cannot be negative' });
    }

    bRecord.category = category || bRecord.category;
    bRecord.budget = budget !== undefined ? Number(budget) : bRecord.budget;

    await bRecord.save();

    res.json({
      success: true,
      message: 'Budget updated successfully',
      data: bRecord,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
export const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findOneAndDelete({
      _id: req.params.id,
      userId: req.user._id,
    });

    if (!budget) {
      return res.status(404).json({ success: false, message: 'Budget record not found' });
    }

    res.json({ success: true, message: 'Budget deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Budget Analytics & Charts
// @route   GET /api/budgets/analytics
// @access  Private
export const getBudgetAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    const now = new Date();
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    const budgets = await Budget.find({
      userId,
      month: currentMonth,
      year: currentYear,
    });

    const startOfMonth = new Date(currentYear, currentMonth - 1, 1);
    const endOfMonth = new Date(currentYear, currentMonth, 0, 23, 59, 59);

    const expensesByCategory = await Expense.aggregate([
      {
        $match: {
          userId,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: { $toLower: '$category' },
          totalSpent: { $sum: '$amount' },
        },
      },
    ]);

    const expenseMap = {};
    expensesByCategory.forEach((item) => {
      expenseMap[item._id] = item.totalSpent;
    });

    const chartData = budgets.map((b) => ({
      category: b.category,
      budget: b.budget,
      spent: expenseMap[b.category.toLowerCase()] || 0,
    }));

    res.json({
      success: true,
      data: {
        budgetVsActualChart: chartData,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
