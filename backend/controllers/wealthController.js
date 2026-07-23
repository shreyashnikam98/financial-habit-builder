import WealthAsset from '../models/WealthAsset.js';

// @desc    Get all wealth assets for logged in user
// @route   GET /api/wealth
// @access  Private
export const getWealthAssets = async (req, res) => {
  try {
    const assets = await WealthAsset.find({ user: req.user._id }).sort({ currentValue: -1 });

    const totalPortfolioValue = assets.reduce((acc, asset) => acc + asset.currentValue, 0);
    const totalInvestedValue = assets.reduce((acc, asset) => acc + asset.initialValue, 0);
    const totalGainLoss = totalPortfolioValue - totalInvestedValue;

    res.json({
      success: true,
      summary: {
        totalPortfolioValue,
        totalInvestedValue,
        totalGainLoss,
        growthPercentage: totalInvestedValue > 0 ? ((totalGainLoss / totalInvestedValue) * 100).toFixed(2) : 0,
      },
      data: assets,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add a new wealth asset
// @route   POST /api/wealth
// @access  Private
export const createWealthAsset = async (req, res) => {
  try {
    const { name, assetType, initialValue, currentValue, expectedReturnRate, notes } = req.body;

    if (!name || !assetType || initialValue === undefined || currentValue === undefined) {
      return res.status(400).json({
        success: false,
        message: 'Name, asset type, initial value, and current value are required',
      });
    }

    const asset = await WealthAsset.create({
      user: req.user._id,
      name,
      assetType,
      initialValue: Number(initialValue),
      currentValue: Number(currentValue),
      expectedReturnRate: expectedReturnRate !== undefined ? Number(expectedReturnRate) : 7.0,
      notes: notes || '',
    });

    res.status(201).json({ success: true, data: asset });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update wealth asset value / details
// @route   PUT /api/wealth/:id
// @access  Private
export const updateWealthAsset = async (req, res) => {
  try {
    const asset = await WealthAsset.findOne({ _id: req.params.id, user: req.user._id });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    asset.name = req.body.name || asset.name;
    asset.assetType = req.body.assetType || asset.assetType;
    asset.initialValue = req.body.initialValue !== undefined ? Number(req.body.initialValue) : asset.initialValue;
    asset.currentValue = req.body.currentValue !== undefined ? Number(req.body.currentValue) : asset.currentValue;
    asset.expectedReturnRate = req.body.expectedReturnRate !== undefined ? Number(req.body.expectedReturnRate) : asset.expectedReturnRate;
    asset.notes = req.body.notes !== undefined ? req.body.notes : asset.notes;

    const updated = await asset.save();
    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete wealth asset
// @route   DELETE /api/wealth/:id
// @access  Private
export const deleteWealthAsset = async (req, res) => {
  try {
    const asset = await WealthAsset.findOneAndDelete({ _id: req.params.id, user: req.user._id });

    if (!asset) {
      return res.status(404).json({ success: false, message: 'Asset not found' });
    }

    res.json({ success: true, message: 'Asset deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
