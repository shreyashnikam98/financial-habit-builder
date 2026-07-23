import React, { useEffect, useState } from 'react';
import {
  FiPlus,
  FiBriefcase,
  FiDollarSign,
  FiAlertTriangle,
  FiCheckCircle,
  FiPieChart,
  FiEdit2,
  FiTrash2,
  FiBarChart2,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { budgetService } from '../services/budgetService';
import { toast } from 'react-toastify';

const PRESET_CATEGORIES = ['Food', 'Bills', 'Travel', 'Shopping', 'Medical', 'Education', 'Entertainment', 'Housing', 'Other'];

const Budgets = () => {
  const [budgets, setBudgets] = useState([]);
  const [summary, setSummary] = useState({ totalMonthlyBudget: 0, totalMonthlySpent: 0, totalRemaining: 0 });
  const [alerts, setAlerts] = useState([]);
  const [analytics, setAnalytics] = useState({ budgetVsActualChart: [] });
  const [loading, setLoading] = useState(true);

  // Form & Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [form, setForm] = useState({ category: 'Food', budget: '' });

  const fetchBudgetData = async () => {
    try {
      setLoading(true);
      const [res, analyticsRes] = await Promise.all([
        budgetService.getBudgets(),
        budgetService.getBudgetAnalytics(),
      ]);

      if (res.success) {
        setBudgets(res.data);
        setSummary(res.summary);
        setAlerts(res.alerts || []);
      }

      if (analyticsRes.success) {
        setAnalytics(analyticsRes.data);
      }
    } catch (err) {
      toast.error('Failed to load budget records');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgetData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingBudget(null);
    setForm({ category: 'Food', budget: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (b) => {
    setEditingBudget(b);
    setForm({ category: b.category, budget: b.budget });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.category || !form.budget) {
      toast.error('Please select category and budget limit');
      return;
    }
    if (Number(form.budget) < 0) {
      toast.error('Budget limit cannot be negative');
      return;
    }

    try {
      if (editingBudget) {
        const res = await budgetService.updateBudget(editingBudget._id, form);
        if (res.success) {
          toast.success('Budget updated!');
          setIsModalOpen(false);
          fetchBudgetData();
        }
      } else {
        const res = await budgetService.createBudget(form);
        if (res.success) {
          toast.success('Category budget created!');
          setIsModalOpen(false);
          fetchBudgetData();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category budget?')) return;
    try {
      const res = await budgetService.deleteBudget(id);
      if (res.success) {
        toast.success('Category budget deleted');
        fetchBudgetData();
      }
    } catch (err) {
      toast.error('Failed to delete budget');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header & Main Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Monthly Budget Planner
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Allocate category budgets, monitor real-time spending, and receive budget alerts
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 hover:bg-purple-600 text-white font-bold text-xs transition-all shadow-md shadow-purple-500/20 self-start sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Set Category Budget</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Monthly Budget"
          value={`$${(summary.totalMonthlyBudget || 0).toLocaleString()}`}
          icon={FiBriefcase}
          color="purple"
          subtext="Allocated cap across all categories"
        />

        <StatCard
          title="Total Actual Spent"
          value={`$${(summary.totalMonthlySpent || 0).toLocaleString()}`}
          icon={FiDollarSign}
          color="rose"
          subtext="Actual expenses recorded this month"
        />

        <StatCard
          title="Remaining Budget Balance"
          value={`$${(summary.totalRemaining || 0).toLocaleString()}`}
          icon={FiCheckCircle}
          color="emerald"
          subtext="Unspent monthly budget allowance"
        />
      </div>

      {/* Budget Alerts Banner */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.map((alert, idx) => (
            <div
              key={idx}
              className={`p-4 rounded-2xl flex items-center gap-3 border text-xs font-bold shadow-xs ${
                alert.type === 'danger'
                  ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                  : 'bg-amber-500/10 border-amber-500/20 text-amber-500'
              }`}
            >
              <FiAlertTriangle className="w-5 h-5 shrink-0" />
              <span>{alert.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Budget Analytics Chart */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <FiBarChart2 className="text-purple-500 w-5 h-5" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Budgeted vs Actual Spending Analytics
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Comparison per category for the current calendar month
            </p>
          </div>
        </div>

        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={analytics.budgetVsActualChart || []}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
              <XAxis dataKey="category" stroke="#94a3b8" fontSize={11} />
              <YAxis stroke="#94a3b8" fontSize={11} />
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                formatter={(val) => [`$${Number(val).toLocaleString()}`]}
              />
              <Legend verticalAlign="top" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              <Bar dataKey="budget" name="Budget Limit" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
              <Bar dataKey="spent" name="Actual Spent" fill="#f43f5e" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Budget Grid */}
      {loading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-purple-500" />
        </div>
      ) : budgets.length === 0 ? (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-12 text-center">
          <FiBriefcase className="w-12 h-12 mx-auto text-slate-400 mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            No Category Budgets Configured
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-4 max-w-sm mx-auto">
            Click "Set Category Budget" to define spending limits for Food, Travel, Shopping, Bills, etc.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {budgets.map((b) => {
            const usagePct = b.usagePct || 0;
            const isExceeded = usagePct >= 100;
            const isWarning = usagePct >= 80 && usagePct < 100;

            return (
              <div
                key={b._id}
                className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-500/40 transition-all"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
                      {b.category}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider ${
                        isExceeded
                          ? 'bg-rose-500/10 text-rose-500'
                          : isWarning
                          ? 'bg-amber-500/10 text-amber-500'
                          : 'bg-emerald-500/10 text-emerald-500'
                      }`}
                    >
                      {isExceeded ? 'Exceeded' : isWarning ? 'Warning' : 'On Track'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="text-slate-400">Spent: <strong className="text-rose-500">${b.spent.toLocaleString()}</strong></span>
                    <span className="text-slate-400">Limit: <strong className="text-slate-900 dark:text-white">${b.budget.toLocaleString()}</strong></span>
                  </div>

                  {/* Progress bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-400">Budget Usage</span>
                      <span className={isExceeded ? 'text-rose-500' : isWarning ? 'text-amber-500' : 'text-emerald-500'}>
                        {usagePct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-3 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isExceeded ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, usagePct)}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-xs text-slate-400 font-medium">
                    Remaining: <strong className="text-slate-900 dark:text-white">${b.remaining.toLocaleString()}</strong>
                  </span>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEditModal(b)}
                      className="p-2 rounded-xl text-slate-400 hover:text-purple-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit Budget Limit"
                    >
                      <FiEdit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(b._id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Delete Budget"
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

      {/* Add / Edit Budget Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingBudget ? 'Edit Category Budget' : 'Set Category Budget'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Category
            </label>
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            >
              {PRESET_CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Monthly Limit ($)
            </label>
            <input
              type="number"
              value={form.budget}
              onChange={(e) => setForm({ ...form, budget: e.target.value })}
              placeholder="500"
              required
              min={0}
              step="any"
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
              className="px-4 py-2 text-xs font-bold bg-purple-500 text-white rounded-xl hover:bg-purple-600"
            >
              {editingBudget ? 'Update Limit' : 'Save Budget'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Budgets;
