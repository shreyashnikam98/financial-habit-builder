import React, { useEffect, useState } from 'react';
import {
  FiPlus,
  FiTarget,
  FiDollarSign,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiBell,
  FiTrash2,
  FiEdit2,
  FiTrendingUp,
} from 'react-icons/fi';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { goalService } from '../services/goalService';
import { toast } from 'react-toastify';

const Goals = () => {
  const [goals, setGoals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('upcoming'); // 'upcoming', 'completed', 'all'

  // Modals & Form states
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [isContributeModalOpen, setIsContributeModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState(null);
  const [selectedGoalForContribution, setSelectedGoalForContribution] = useState(null);
  const [contributionAmount, setContributionAmount] = useState('');

  const [formData, setFormData] = useState({
    goalName: '',
    targetAmount: '',
    savedAmount: '0',
    deadline: '',
    reminderEnabled: true,
  });

  const fetchGoals = async () => {
    try {
      setLoading(true);
      const res = await goalService.getGoals();
      if (res.success) {
        setGoals(res.data);
      }
    } catch (err) {
      toast.error('Failed to load financial goals');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleOpenAddModal = () => {
    setEditingGoal(null);
    setFormData({
      goalName: '',
      targetAmount: '',
      savedAmount: '0',
      deadline: '',
      reminderEnabled: true,
    });
    setIsGoalModalOpen(true);
  };

  const handleOpenEditModal = (goal) => {
    setEditingGoal(goal);
    setFormData({
      goalName: goal.goalName || goal.title,
      targetAmount: goal.targetAmount,
      savedAmount: goal.savedAmount ?? goal.currentAmount ?? 0,
      deadline: (goal.deadline || goal.targetDate)
        ? new Date(goal.deadline || goal.targetDate).toISOString().split('T')[0]
        : '',
      reminderEnabled: goal.reminderEnabled !== undefined ? goal.reminderEnabled : true,
    });
    setIsGoalModalOpen(true);
  };

  const handleOpenContributeModal = (goal) => {
    setSelectedGoalForContribution(goal);
    setContributionAmount('');
    setIsContributeModalOpen(true);
  };

  const handleSubmitGoal = async (e) => {
    e.preventDefault();
    if (!formData.goalName || !formData.targetAmount || !formData.deadline) {
      toast.error('Please fill in goal name, target amount, and deadline date');
      return;
    }

    try {
      if (editingGoal) {
        const res = await goalService.updateGoal(editingGoal._id, formData);
        if (res.success) {
          toast.success('Financial goal updated!');
          setIsGoalModalOpen(false);
          fetchGoals();
        }
      } else {
        const res = await goalService.createGoal(formData);
        if (res.success) {
          toast.success('New goal created!');
          setIsGoalModalOpen(false);
          fetchGoals();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save goal');
    }
  };

  const handleContributeSubmit = async (e) => {
    e.preventDefault();
    if (!contributionAmount || Number(contributionAmount) <= 0) {
      toast.error('Please enter a positive contribution amount');
      return;
    }

    try {
      const res = await goalService.contributeGoal(selectedGoalForContribution._id, Number(contributionAmount));
      if (res.success) {
        toast.success(`Deposited $${Number(contributionAmount).toLocaleString()} towards goal!`);
        setIsContributeModalOpen(false);
        fetchGoals();
      }
    } catch (err) {
      toast.error('Failed to process contribution');
    }
  };

  const handleSendReminder = async (goalId) => {
    try {
      const res = await goalService.sendReminder(goalId);
      if (res.success) {
        toast.info(res.message || 'Goal reminder triggered!');
      }
    } catch (err) {
      toast.error('Failed to trigger reminder');
    }
  };

  const handleDeleteGoal = async (id) => {
    if (!window.confirm('Are you sure you want to delete this financial goal?')) return;
    try {
      const res = await goalService.deleteGoal(id);
      if (res.success) {
        toast.success('Goal deleted');
        fetchGoals();
      }
    } catch (err) {
      toast.error('Failed to delete goal');
    }
  };

  // Filter goals based on active tab
  const upcomingGoals = goals.filter((g) => g.status === 'In Progress' || g.status === 'Overdue');
  const completedGoals = goals.filter((g) => g.status === 'Achieved');

  const displayedGoals =
    activeTab === 'upcoming'
      ? upcomingGoals
      : activeTab === 'completed'
      ? completedGoals
      : goals;

  // Overview Metrics
  const totalTargetSum = goals.reduce((sum, g) => sum + (g.targetAmount || 0), 0);
  const totalSavedSum = goals.reduce((sum, g) => sum + (g.savedAmount ?? g.currentAmount ?? 0), 0);
  const overallProgressPct = totalTargetSum > 0 ? Math.min(100, Math.round((totalSavedSum / totalTargetSum) * 100)) : 0;

  return (
    <div className="space-y-6">
      {/* Header & Quick Add */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Goal Tracking
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Set target savings milestones, track automatic progress, and trigger reminders
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs transition-all shadow-md shadow-blue-500/20 self-start sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Create New Goal</span>
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Goals Target"
          value={`$${totalTargetSum.toLocaleString()}`}
          icon={FiTarget}
          color="blue"
          subtext="Total target capital across all milestones"
        />

        <StatCard
          title="Total Funds Saved"
          value={`$${totalSavedSum.toLocaleString()}`}
          icon={FiDollarSign}
          color="emerald"
          subtext="Capital accumulated so far"
        />

        <StatCard
          title="Overall Goal Progress"
          value={`${overallProgressPct}%`}
          icon={FiTrendingUp}
          color="purple"
          subtext={`${completedGoals.length} achieved of ${goals.length} total goals`}
        />
      </div>

      {/* Navigation Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 dark:border-slate-800 pb-2">
        <button
          onClick={() => setActiveTab('upcoming')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'upcoming'
              ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiClock className="w-3.5 h-3.5" />
          <span>Upcoming & Active ({upcomingGoals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('completed')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'completed'
              ? 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiCheckCircle className="w-3.5 h-3.5" />
          <span>Completed Goals ({completedGoals.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'all'
              ? 'bg-purple-500 text-white shadow-md shadow-purple-500/20'
              : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <FiTarget className="w-3.5 h-3.5" />
          <span>All Goals ({goals.length})</span>
        </button>
      </div>

      {/* Goal Cards Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500" />
        </div>
      ) : displayedGoals.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FiTarget className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Goals Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            You don't have any financial goals in this view. Click "Create New Goal" to start tracking your targets.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedGoals.map((goal) => {
            const saved = goal.savedAmount ?? goal.currentAmount ?? 0;
            const target = goal.targetAmount || 1;
            const pct = Math.min(100, Math.round((saved / target) * 100));
            const isAchieved = goal.status === 'Achieved' || saved >= target;
            const isOverdue = goal.status === 'Overdue';
            const deadlineDate = goal.deadline || goal.targetDate;

            return (
              <div
                key={goal._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-500/40 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white leading-snug">
                      {goal.goalName || goal.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        isAchieved
                          ? 'bg-emerald-500/10 text-emerald-500'
                          : isOverdue
                          ? 'bg-rose-500/10 text-rose-500'
                          : 'bg-blue-500/10 text-blue-500'
                      }`}
                    >
                      {isAchieved ? 'Achieved' : isOverdue ? 'Overdue' : 'In Progress'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                    <div className="flex items-center gap-1">
                      <FiCalendar className="w-3.5 h-3.5" />
                      <span>{deadlineDate ? new Date(deadlineDate).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <span className="font-extrabold text-slate-900 dark:text-white text-sm">
                      ${saved.toLocaleString()} / ${target.toLocaleString()}
                    </span>
                  </div>

                  {/* Automatic Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Target Progress</span>
                      <span className={isAchieved ? 'text-emerald-500' : 'text-blue-500'}>{pct}%</span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isAchieved ? 'bg-emerald-500' : isOverdue ? 'bg-rose-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                  {!isAchieved && (
                    <button
                      onClick={() => handleOpenContributeModal(goal)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs transition-all flex items-center gap-1 cursor-pointer"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      <span>Contribute</span>
                    </button>
                  )}

                  <div className="flex items-center gap-1 ml-auto">
                    <button
                      onClick={() => handleSendReminder(goal._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Send Email Reminder"
                    >
                      <FiBell className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleOpenEditModal(goal)}
                      className="p-2 rounded-xl text-slate-400 hover:text-blue-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Goal"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => handleDeleteGoal(goal._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Goal"
                    >
                      <FiTrash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add / Edit Goal Modal */}
      <Modal
        isOpen={isGoalModalOpen}
        onClose={() => setIsGoalModalOpen(false)}
        title={editingGoal ? 'Edit Financial Goal' : 'Create New Financial Goal'}
      >
        <form onSubmit={handleSubmitGoal} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Goal Name
            </label>
            <input
              type="text"
              value={formData.goalName}
              onChange={(e) => setFormData({ ...formData, goalName: e.target.value })}
              placeholder="e.g. Emergency Fund, New Car Deposit, Vacation"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Target Amount ($)
            </label>
            <input
              type="number"
              value={formData.targetAmount}
              onChange={(e) => setFormData({ ...formData, targetAmount: e.target.value })}
              placeholder="5000"
              required
              min={1}
              step="any"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Already Saved Amount ($)
            </label>
            <input
              type="number"
              value={formData.savedAmount}
              onChange={(e) => setFormData({ ...formData, savedAmount: e.target.value })}
              placeholder="1000"
              min={0}
              step="any"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deadline Date
            </label>
            <input
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="reminderEnabled"
              checked={formData.reminderEnabled}
              onChange={(e) => setFormData({ ...formData, reminderEnabled: e.target.checked })}
              className="w-4 h-4 text-blue-500 rounded focus:ring-0 cursor-pointer"
            />
            <label htmlFor="reminderEnabled" className="text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer">
              Enable goal progress email reminders
            </label>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsGoalModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-blue-500 text-white rounded-xl hover:bg-blue-600"
            >
              {editingGoal ? 'Update Goal' : 'Save Goal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Contribution Modal */}
      <Modal
        isOpen={isContributeModalOpen}
        onClose={() => setIsContributeModalOpen(false)}
        title={`Deposit to "${selectedGoalForContribution?.goalName || selectedGoalForContribution?.title}"`}
      >
        <form onSubmit={handleContributeSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Deposit Amount ($)
            </label>
            <input
              type="number"
              value={contributionAmount}
              onChange={(e) => setContributionAmount(e.target.value)}
              placeholder="500"
              required
              min={1}
              step="any"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsContributeModalOpen(false)}
              className="px-4 py-2 text-xs font-medium text-slate-400 hover:bg-slate-800 rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold bg-emerald-500 text-white rounded-xl hover:bg-emerald-600"
            >
              Add Contribution
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Goals;
