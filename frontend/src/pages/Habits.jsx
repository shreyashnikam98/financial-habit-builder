import React, { useEffect, useState } from 'react';
import {
  FiPlus,
  FiCheckSquare,
  FiTrash2,
  FiZap,
  FiAward,
  FiCalendar,
  FiEdit2,
  FiPieChart,
  FiCheck,
} from 'react-icons/fi';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { habitService } from '../services/habitService';
import { toast } from 'react-toastify';

const PRESET_HABITS = [
  'Save ₹100 Daily',
  'No Online Shopping',
  'Read Finance Book',
  'Invest Every Month',
  'Drink Water',
  'Exercise',
];

const Habits = () => {
  const [habits, setHabits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCalendarHabit, setSelectedCalendarHabit] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingHabit, setEditingHabit] = useState(null);
  const [form, setForm] = useState({ habitName: '', frequency: 'Daily', target: 1 });

  const fetchHabits = async () => {
    try {
      setLoading(true);
      const res = await habitService.getHabits();
      if (res.success) {
        setHabits(res.data);
        if (res.data.length > 0 && !selectedCalendarHabit) {
          setSelectedCalendarHabit(res.data[0]);
        }
      }
    } catch (err) {
      toast.error('Failed to load habits');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleOpenAddModal = (initialName = '') => {
    setEditingHabit(null);
    setForm({ habitName: initialName, frequency: 'Daily', target: 1 });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (habit) => {
    setEditingHabit(habit);
    setForm({
      habitName: habit.habitName || habit.title,
      frequency: habit.frequency || 'Daily',
      target: habit.target || 1,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.habitName) {
      toast.error('Please enter a habit name');
      return;
    }

    try {
      if (editingHabit) {
        const res = await habitService.updateHabit(editingHabit._id, form);
        if (res.success) {
          toast.success('Habit updated!');
          setIsModalOpen(false);
          fetchHabits();
        }
      } else {
        const res = await habitService.createHabit(form);
        if (res.success) {
          toast.success('Habit created!');
          setIsModalOpen(false);
          fetchHabits();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save habit');
    }
  };

  const handleToggleCheckin = async (id, dateStr) => {
    try {
      const res = await habitService.toggleHabit(id, dateStr);
      if (res.success) {
        toast.success('Check-in status updated!');
        fetchHabits();
      }
    } catch (err) {
      toast.error('Failed to update check-in');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this habit?')) return;
    try {
      const res = await habitService.deleteHabit(id);
      if (res.success) {
        toast.success('Habit deleted');
        fetchHabits();
      }
    } catch (err) {
      toast.error('Failed to delete habit');
    }
  };

  const todayStr = new Date().toISOString().split('T')[0];

  // Helper for calendar grid (current month)
  const renderCalendarGrid = (habit) => {
    if (!habit) return null;
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    const completedSet = new Set(habit.completedDays || habit.completedDates || []);

    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(year, month, day);
      const dateString = d.toISOString().split('T')[0];
      const isDone = completedSet.has(dateString);
      const isToday = dateString === todayStr;

      days.push(
        <button
          key={dateString}
          onClick={() => handleToggleCheckin(habit._id, dateString)}
          className={`h-10 rounded-xl flex flex-col items-center justify-center text-xs font-bold transition-all ${
            isDone
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : isToday
              ? 'border-2 border-emerald-500 text-emerald-500 font-black'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
          }`}
          title={`${dateString} - ${isDone ? 'Completed' : 'Not completed'}`}
        >
          <span>{day}</span>
          {isDone && <FiCheck className="w-3 h-3 stroke-[3]" />}
        </button>
      );
    }

    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">
            {now.toLocaleString('default', { month: 'long' })} {year} Calendar
          </h4>
          <span className="text-xs text-slate-400">Click day to toggle check-in</span>
        </div>
        <div className="grid grid-cols-7 gap-2">{days}</div>
      </div>
    );
  };

  // Metric summaries
  const totalHabits = habits.length;
  const completedTodayCount = habits.filter((h) =>
    (h.completedDays || h.completedDates || []).includes(todayStr)
  ).length;
  const avgCompletionPct =
    totalHabits > 0
      ? Math.round(
          (habits.reduce(
            (sum, h) =>
              sum + Math.min(100, Math.round(((h.completedDays?.length || 0) / 30) * 100)),
            0
          ) /
            totalHabits)
        )
      : 0;

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Habit Builder
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Build compounding money habits with daily check-ins and streak rewards
          </p>
        </div>

        <button
          onClick={() => handleOpenAddModal()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all shadow-md shadow-emerald-500/20 self-start sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create Custom Habit</span>
        </button>
      </div>

      {/* Preset Habit Chips */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 shadow-xs">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
          Quick Start Presets:
        </p>
        <div className="flex flex-wrap gap-2">
          {PRESET_HABITS.map((preset) => (
            <button
              key={preset}
              onClick={() => handleOpenAddModal(preset)}
              className="px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-emerald-500 hover:text-white text-slate-700 dark:text-slate-300 text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <FiPlus className="w-3.5 h-3.5" />
              <span>{preset}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Active Habits"
          value={totalHabits}
          icon={FiCheckSquare}
          color="emerald"
          subtext="Total habits currently tracked"
        />

        <StatCard
          title="Today's Check-ins"
          value={`${completedTodayCount} / ${totalHabits}`}
          icon={FiZap}
          color="amber"
          subtext="Habits completed today"
        />

        <StatCard
          title="Avg Monthly Completion"
          value={`${avgCompletionPct}%`}
          icon={FiPieChart}
          color="purple"
          subtext="30-day consistency score"
        />
      </div>

      {/* Main Habits & Calendar Split View */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-emerald-500" />
        </div>
      ) : habits.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FiCheckSquare className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Habits Created Yet
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            Click any quick start preset above or create your own financial habit to build discipline.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Habit Cards List */}
          <div className="lg:col-span-2 space-y-4">
            {habits.map((habit) => {
              const completedList = habit.completedDays || habit.completedDates || [];
              const isDoneToday = completedList.includes(todayStr);
              const currentStreak = habit.currentStreak || habit.streak || 0;
              const longestStreak = habit.longestStreak || currentStreak;
              const completionPct = Math.min(100, Math.round((completedList.length / 30) * 100));

              return (
                <div
                  key={habit._id}
                  className={`bg-white dark:bg-slate-900 border rounded-3xl p-5 shadow-xs transition-all ${
                    isDoneToday
                      ? 'border-emerald-500/40 bg-emerald-50/10 dark:bg-emerald-950/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleToggleCheckin(habit._id, todayStr)}
                        className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all cursor-pointer ${
                          isDoneToday
                            ? 'bg-emerald-500 border-emerald-500 text-white'
                            : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500'
                        }`}
                      >
                        {isDoneToday && <FiCheck className="w-4 h-4 stroke-[3]" />}
                      </button>
                      <div>
                        <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                          {habit.habitName || habit.title}
                        </h3>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Frequency: {habit.frequency || 'Daily'}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setSelectedCalendarHabit(habit)}
                        className="p-2 rounded-xl text-slate-400 hover:text-emerald-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="View Calendar"
                      >
                        <FiCalendar className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(habit)}
                        className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Edit Habit"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(habit._id)}
                        className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        title="Delete Habit"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Streaks Badges */}
                  <div className="flex items-center gap-3 my-3">
                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-amber-500/10 text-amber-500 text-xs font-bold">
                      <FiZap className="w-3.5 h-3.5" />
                      <span>Current Streak: {currentStreak} Days 🔥</span>
                    </div>

                    <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-purple-500/10 text-purple-500 text-xs font-bold">
                      <FiAward className="w-3.5 h-3.5" />
                      <span>Best Streak: {longestStreak} Days 🏆</span>
                    </div>
                  </div>

                  {/* Completion Progress Bar */}
                  <div className="mt-4 space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-slate-400">Monthly Completion</span>
                      <span className="text-emerald-500 font-extrabold">{completionPct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                        style={{ width: `${completionPct}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Interactive Monthly Calendar View */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs h-fit">
            <h3 className="text-base font-bold text-slate-900 dark:text-white mb-2">
              Monthly Calendar Check-in
            </h3>
            {selectedCalendarHabit ? (
              <div>
                <p className="text-xs text-emerald-500 font-bold mb-4">
                  Viewing: {selectedCalendarHabit.habitName || selectedCalendarHabit.title}
                </p>
                {renderCalendarGrid(selectedCalendarHabit)}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Select a habit to view calendar check-ins.</p>
            )}
          </div>
        </div>
      )}

      {/* Add / Edit Habit Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingHabit ? 'Edit Habit' : 'Create New Financial Habit'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Habit Name
            </label>
            <input
              type="text"
              value={form.habitName}
              onChange={(e) => setForm({ ...form, habitName: e.target.value })}
              placeholder="e.g. Save ₹100 Daily, No Online Shopping"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Frequency
            </label>
            <select
              value={form.frequency}
              onChange={(e) => setForm({ ...form, frequency: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            >
              <option value="Daily">Daily</option>
              <option value="Weekly">Weekly</option>
              <option value="Monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Count Per Period
            </label>
            <input
              type="number"
              value={form.target}
              onChange={(e) => setForm({ ...form, target: Number(e.target.value) })}
              min={1}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
            >
              {editingHabit ? 'Update Habit' : 'Create Habit'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Habits;
