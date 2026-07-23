import mongoose from 'mongoose';

const investmentSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    name: {
      type: String,
      required: [true, 'Please provide investment name'],
      trim: true,
    },
    type: {
      type: String,
      enum: ['Stocks', 'Mutual Funds', 'Gold', 'Crypto', 'FD', 'Real Estate'],
      required: [true, 'Please provide investment type'],
      trim: true,
    },
    investedAmount: {
      type: Number,
      required: [true, 'Please provide invested amount'],
      min: [0, 'Invested amount cannot be negative'],
    },
    currentValue: {
      type: Number,
      required: [true, 'Please provide current value'],
      min: [0, 'Current value cannot be negative'],
    },
    profitLoss: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Auto compute profitLoss prior to save
investmentSchema.pre('save', function (next) {
  this.profitLoss = this.currentValue - this.investedAmount;
  next();
});

const Investment = mongoose.model('Investment', investmentSchema);

export default Investment;
