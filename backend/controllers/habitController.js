import Habit from '../models/Habit.js';
import User from '../models/User.js';

// Helper to calculate current & longest streak
const calculateStreaks = (datesArray) => {
  if (!datesArray || datesArray.length === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = Array.from(new Set(datesArray)).sort();
  const today = new Date().toISOString().split('T')[0];

  let currentStreak = 0;
  let checkDate = new Date(today);

  while (true) {
    const dStr = checkDate.toISOString().split('T')[0];
    if (sorted.includes(dStr)) {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      if (dStr === today && sorted.length > 0) {
        checkDate.setDate(checkDate.getDate() - 1);
        continue;
      }
      break;
    }
  }

  // Longest streak calculation
  let longestStreak = 0;
  let tempStreak = 0;
  let prevDate = null;

  for (const dateStr of sorted) {
    const currDate = new Date(dateStr);
    if (!prevDate) {
      tempStreak = 1;
    } else {
      const diffTime = Math.abs(currDate - prevDate);
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        tempStreak++;
      } else if (diffDays > 1) {
        tempStreak = 1;
      }
    }
    prevDate = currDate;
    if (tempStreak > longestStreak) {
      longestStreak = tempStreak;
    }
  }

  return { currentStreak, longestStreak: Math.max(longestStreak, currentStreak) };
};

// @desc    Get all habits for logged in user
// @route   GET /api/habits
// @access  Private
export const getHabits = async (req, res) => {
  try {
    const userId = req.user._id;
    const habits = await Habit.find({
      $or: [{ userId }, { user: userId }],
    }).sort({ createdAt: -1 });

    res.json({ success: true, count: habits.length, data: habits });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create a new habit
// @route   POST /api/habits
// @access  Private
export const createHabit = async (req, res) => {
  try {
    const { habitName, title, frequency, target } = req.body;
    const finalName = habitName || title;

    if (!finalName) {
      return res.status(400).json({ success: false, message: 'Habit name is required' });
    }

    const habit = await Habit.create({
      userId: req.user._id,
      habitName: finalName,
      frequency: frequency || 'Daily',
      target: target || 1,
      completedDays: [],
      currentStreak: 0,
      longestStreak: 0,
    });

    res.status(201).json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Toggle habit daily check-in completion
// @route   POST /api/habits/:id/toggle
// @access  Private
export const toggleHabitCompletion = async (req, res) => {
  try {
    const userId = req.user._id;
    const habit = await Habit.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    const dateStr = req.body.date || new Date().toISOString().split('T')[0];
    const days = habit.completedDays || [];
    const index = days.indexOf(dateStr);

    if (index > -1) {
      days.splice(index, 1);
    } else {
      days.push(dateStr);
    }

    habit.completedDays = days;

    const { currentStreak, longestStreak } = calculateStreaks(habit.completedDays);
    habit.currentStreak = currentStreak;
    habit.longestStreak = Math.max(habit.longestStreak || 0, longestStreak);

    await habit.save();

    res.json({ success: true, data: habit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update habit details
// @route   PUT /api/habits/:id
// @access  Private
export const updateHabit = async (req, res) => {
  try {
    const userId = req.user._id;
    const habit = await Habit.findOne({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    habit.habitName = req.body.habitName || req.body.title || habit.habitName;
    habit.frequency = req.body.frequency || habit.frequency;
    habit.target = req.body.target !== undefined ? req.body.target : habit.target;

    const updatedHabit = await habit.save();
    res.json({ success: true, data: updatedHabit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete habit
// @route   DELETE /api/habits/:id
// @access  Private
export const deleteHabit = async (req, res) => {
  try {
    const userId = req.user._id;
    const habit = await Habit.findOneAndDelete({
      _id: req.params.id,
      $or: [{ userId }, { user: userId }],
    });

    if (!habit) {
      return res.status(404).json({ success: false, message: 'Habit not found' });
    }

    res.json({ success: true, message: 'Habit deleted successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
