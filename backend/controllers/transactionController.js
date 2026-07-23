import Transaction from '../models/Transaction.js';

// @desc    Get transactions for logged in user (with optional filtering)
// @route   GET /api/transactions
// @access  Private
export const getTransactions = async (req, res) => {
  try {
    const { type, category, startDate, endDate } = req.query;
    const filter = { user: req.user._id };

    if (type) filter.type = type;
    if (category) filter.category = category;
    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    const transactions = await Transaction.find(filter).sort({ date: -1, createdAt: -1 });
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new transaction
// @route   POST /api/transactions
// @access  Private
export const createTransaction = async (req, res) => {
  try {
    const { title, type, amount, category, date, notes } = req.body;

    if (!title || !type || !amount || !category) {
      return res.status(400).json({
        success: false,
        message: 'Title, type, amount, and category are required',
      });
    }

    let receiptUrl = '';
    if (req.file) {
      receiptUrl = `/uploads/${req.file.filename}`;
    }

    const transaction = await Transaction.create({
      user: req.user._id,
      title,
      type,
      amount: Number(amount),
      category,
      date: date ? new Date(date) : new Date(),
      notes: notes || '',
      receiptUrl,
    });

    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOne({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    transaction.title = req.body.title || transaction.title;
    transaction.type = req.body.type || transaction.type;
    transaction.amount = req.body.amount !== undefined ? Number(req.body.amount) : transaction.amount;
    transaction.category = req.body.category || transaction.category;
    transaction.date = req.body.date ? new Date(req.body.date) : transaction.date;
    transaction.notes = req.body.notes !== undefined ? req.body.notes : transaction.notes;

    if (req.file) {
      transaction.receiptUrl = `/uploads/${req.file.filename}`;
    }

    const updated = await transaction.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
export const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.json({ success: true, message: 'Transaction deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
