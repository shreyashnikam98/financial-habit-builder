import Income from '../models/Income.js';

// @desc    Create new income record
// @route   POST /api/incomes
// @access  Private
export const createIncome = async (req, res) => {
  try {
    const { source, amount, date, notes } = req.body;

    if (!source || amount === undefined || amount === null) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both source and a valid amount',
      });
    }

    if (Number(amount) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Income amount cannot be negative',
      });
    }

    const income = await Income.create({
      userId: req.user._id,
      source,
      amount: Number(amount),
      date: date || new Date(),
      notes: notes || '',
    });

    res.status(201).json({
      success: true,
      message: 'Income added successfully',
      data: income,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all incomes with search, filter, pagination & monthly totals
// @route   GET /api/incomes
// @access  Private
export const getIncomes = async (req, res) => {
  try {
    const { search, source, startDate, endDate, page = 1, limit = 10 } = req.query;

    const query = { userId: req.user._id };

    // Search by source or notes
    if (search) {
      query.$or = [
        { source: { $regex: search, $options: 'i' } },
        { notes: { $regex: search, $options: 'i' } },
      ];
    }

    // Filter by specific source
    if (source && source !== 'all') {
      query.source = { $regex: source, $options: 'i' };
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

    const totalRecords = await Income.countDocuments(query);
    const incomes = await Income.find(query)
      .sort({ date: -1, createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Monthly total calculation (current month)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const monthlyAggregation = await Income.aggregate([
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

    // Overall total matching current query
    const overallAggregation = await Income.aggregate([
      { $match: query },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]);
    const overallFilteredTotal = overallAggregation.length > 0 ? overallAggregation[0].total : 0;

    res.json({
      success: true,
      data: incomes,
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

// @desc    Get single income record by ID
// @route   GET /api/incomes/:id
// @access  Private
export const getIncomeById = async (req, res) => {
  try {
    const income = await Income.findOne({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    res.json({ success: true, data: income });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update income record
// @route   PUT /api/incomes/:id
// @access  Private
export const updateIncome = async (req, res) => {
  try {
    const { source, amount, date, notes } = req.body;

    let income = await Income.findOne({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    if (amount !== undefined && Number(amount) < 0) {
      return res.status(400).json({ success: false, message: 'Amount cannot be negative' });
    }

    income.source = source || income.source;
    income.amount = amount !== undefined ? Number(amount) : income.amount;
    income.date = date || income.date;
    income.notes = notes !== undefined ? notes : income.notes;

    await income.save();

    res.json({
      success: true,
      message: 'Income record updated successfully',
      data: income,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete income record
// @route   DELETE /api/incomes/:id
// @access  Private
export const deleteIncome = async (req, res) => {
  try {
    const income = await Income.findOneAndDelete({ _id: req.params.id, userId: req.user._id });

    if (!income) {
      return res.status(404).json({ success: false, message: 'Income record not found' });
    }

    res.json({ success: true, message: 'Income record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
