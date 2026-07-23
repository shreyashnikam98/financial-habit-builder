import mongoose from 'mongoose';

const habitSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    habitName: {
      type: String,
      required: [true, 'Please provide a habit name'],
      trim: true,
    },
    frequency: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly'],
      default: 'Daily',
    },
    target: {
      type: Number,
      default: 1,
      min: [1, 'Target must be at least 1'],
    },
    completedDays: [
      {
        type: String, // Stored in YYYY-MM-DD format
      },
    ],
    currentStreak: {
      type: Number,
      default: 0,
      min: [0, 'Streak cannot be negative'],
    },
    longestStreak: {
      type: Number,
      default: 0,
      min: [0, 'Longest streak cannot be negative'],
    },
  },
  {
    timestamps: true,
  }
);

const Habit = mongoose.model('Habit', habitSchema);

export default Habit;
