import Investment from '../models/Investment.js';

// @desc    Get all investments for user with portfolio aggregates & distribution
// @route   GET /api/investments
// @access  Private
export const getInvestments = async (req, res) => {
  try {
    const userId = req.user._id;
    const investments = await Investment.find({
      $or: [{ userId }, { user: userId }],
    }).sort({ createdAt: -1 });

    let totalInvested = 0;
    let totalCurrentValue = 0;
    let totalProfitLoss = 0;

    const distributionMap = {};

    investments.forEach((inv) => {
      const invested = inv.investedAmount || 0;
      const current = inv.currentValue || 0;
      const pl = inv.profitLoss ?? (current - invested);

      totalInvested += invested;
      totalCurrentValue += current;
      totalProfitLoss += pl;

      const type = inv.type || 'Other';
      distributionMap[type] = (distributionMap[type] || 0) + current;
    });

    const portfolioReturnPct =
      totalInvested > 0 ? ((totalProfitLoss / totalInvested) * 100).toFixed(2) : 0;

    const distributionChart = Object.keys(distributionMap).map((type) => ({
      name: type,
      value: distributionMap[type],
    }));

    res.json({
      success: true,
      count: investments.length,
      data: investments,
      summary: {
        totalInvested,
        totalCurrentValue,
        totalProfitLoss,
        portfolioReturnPct: Number(portfolioReturnPct),
      },
      distributionChart,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new investment record
// @route   POST /api/investments
// @access  Private
export const createInvestment = async (req, res) => {
  try {
    const { name, type, investedAmount, currentValue } = req.body;

    if (!name || !type || investedAmount === undefined || currentValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, type, invested amount, and current value are required',
      });
    }

    if (Number(investedAmount) < 0 || Number(currentValue) < 0) {
      return res.status(400).json({
        success: false,
        message: 'Amounts cannot be negative',
      });
    }

    const investment = await Investment.create({
      userId: req.user._id,
      name,
      type,
      investedAmount: Number(investedAmount),
      currentValue: Number(currentValue),
      profitLoss: Number(currentValue) - Number(investedAmount),
    });

    res.status(201).json({
      success: true,
      message: 'Investment record added successfully',
      data: investment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single investment record
// @route   GET /api/investments/:id
// @access  Private
export const getInvestmentById = async (req, res) => {
  try {
    const userId = req.user._id;
    const investment = await Investment.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment record not found' });
    }

    res.json({ success: true, data: investment });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update investment record
// @route   PUT /api/investments/:id
// @access  Private
export const updateInvestment = async (req, res) => {
  try {
    const userId = req.user._id;
    let investment = await Investment.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment record not found' });
    }

    const { name, type, investedAmount, currentValue } = req.body;

    if (investedAmount !== undefined && Number(investedAmount) < 0) {
      return res.status(400).json({ success: false, message: 'Invested amount cannot be negative' });
    }
    if (currentValue !== undefined && Number(currentValue) < 0) {
      return res.status(400).json({ success: false, message: 'Current value cannot be negative' });
    }

    investment.name = name || investment.name;
    investment.type = type || investment.type;
    if (investedAmount !== undefined) investment.investedAmount = Number(investedAmount);
    if (currentValue !== undefined) investment.currentValue = Number(currentValue);

    investment.profitLoss = investment.currentValue - investment.investedAmount;

    await investment.save();

    res.json({
      success: true,
      message: 'Investment record updated successfully',
      data: investment,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete investment record
// @route   DELETE /api/investments/:id
// @access  Private
export const deleteInvestment = async (req, res) => {
  try {
    const userId = req.user._id;
    const investment = await Investment.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!investment) {
      return res.status(404).json({ success: false, message: 'Investment record not found' });
    }

    res.json({ success: true, message: 'Investment record deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
