import Expense from '../models/Expense.js';

// @desc    Create new expense record
// @route   POST /api/expenses
// @access  Private
export const createExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    if (!category || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both category and a valid amount',
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Expense amount cannot be negative',
      });
    }

    const expense = await Expense.create({
      userId: req.user._id,
      category,
      amount: Number(amount),
      description: description || '',
      date: date || new Date(),
    });

    res.status(201).json({
      success: true,
      message: 'Expense recorded successfully',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all expenses with search, filter, pagination & summary stats
// @route   GET /api/expenses
// @access  Private
export const getExpenses = async (req, res) => {
  try {
    const { search, category, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };

    // Search by category or description
    if (search) {
      query.$or = [
        { category: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by specific category
    if (category && category !== 'all') {
      query.category = { $regex: `^${category}$`, $options: 'i' };
    }

    // Filter by date range
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    // Pagination calculations
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.max(1, parseInt(limit));
    const skip = (pageNum - 1) * limitNum;

    const totalRecords = await Expense.countDocuments(query);
    const expenses = await Expense.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Current month total calculation
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyAggregation = await Expense.aggregate([
      {
        $match: {
          userId: req.user._id,
          date: { $gte: startOfMonth, $lte: endOfMonth },
        },
      },
      {
        $group: {
          _id: null,
          monthlyTotal: { $sum: '$amount' },
        },
      },
    ]);

    const monthlyTotal = monthlyAggregation.length > 0 ? monthlyAggregation[0].monthlyTotal : 0;

    // Overall total matching current query filters
    const overallAggregation = await Expense.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const overallFilteredTotal = overallAggregation.length > 0 ? overallAggregation[0].total : 0;

    res.json({
      success: true,
      data: expenses,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalRecords,
        totalPages: Math.ceil(totalRecords / limitNum),
      },
      summary: {
        monthlyTotal,
        overallFilteredTotal,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single expense record
// @route   GET /api/expenses/:id
// @access  Private
export const getExpenseById = async (req, res) => {
  try {
    const expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    res.json({ success: true, data: expense });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update expense record
// @route   PUT /api/expenses/:id
// @access  Private
export const updateExpense = async (req, res) => {
  try {
    const { category, amount, description, date } = req.body;

    let expense = await Expense.findOne({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    if (amount !== undefined && Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    expense.category = category || expense.category;
    expense.amount = amount !== undefined ? Number(amount) : expense.amount;
    expense.description = description !== undefined ? description : expense.description;
    expense.date = date || expense.date;

    await expense.save();

    res.json({
      success: true,
      message: 'Expense record updated successfully',
      data: expense,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete expense record
// @route   DELETE /api/expenses/:id
// @access  Private
export const deleteExpense = async (req, res) => {
  try {
    const expense = await Expense.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!expense) {
      return res.status(404).json({ success: false, message: 'Expense record not found' });
    }

    res.json({ success: true, message: 'Expense record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get expense reports (Category Breakdown & Monthly Trends)
// @route   GET /api/expenses/reports
// @access  Private
export const getExpenseReports = async (req, res) => {
  try {
    const userId = req.user._id;

    // Category breakdown aggregation
    const categoryReport = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: '$category',
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Monthly breakdown aggregation
    const monthlyReport = await Expense.aggregate([
      { $match: { userId } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
          },
          totalAmount: { $sum: '$amount' },
          count: { $sum: 1 },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]);

    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const formattedMonthlyReport = monthlyReport.map((m) => ({
      label: `${months[m._id.month - 1]} ${m._id.year}`,
      total: m.totalAmount,
      count: m.count,
    }));

    res.json({
      success: true,
      data: {
        categoryReport: categoryReport.map((c) => ({
          category: c._id,
          totalAmount: c.totalAmount,
          count: c.count,
        })),
        monthlyReport: formattedMonthlyReport,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
