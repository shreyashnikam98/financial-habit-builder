import mongoose from 'mongoose';

const wealthAssetSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: [true, 'Please add asset name'],
      trim: true,
    },
    assetType: {
      type: String,
      enum: ['Stock', 'Crypto', 'Real Estate', 'Cash/Savings', 'Bonds', 'Gold/Commodity', 'Mutual Fund', 'Other'],
      required: [true, 'Please select an asset type'],
    },
    initialValue: {
      type: Number,
      required: [true, 'Please specify initial invested value'],
    },
    currentValue: {
      type: Number,
      required: [true, 'Please specify current asset value'],
    },
    expectedReturnRate: {
      type: Number,
      default: 7.0, // annual return rate percentage default
    },
    notes: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

const WealthAsset = mongoose.model('WealthAsset', wealthAssetSchema);

export default WealthAsset;
