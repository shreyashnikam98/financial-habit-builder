import React, { useEffect, useState } from 'react';
import {
  FiPlus,
  FiTrendingUp,
  FiTrendingDown,
  FiPieChart,
  FiDollarSign,
  FiEdit2,
  FiTrash2,
  FiBriefcase,
  FiCheckCircle,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from 'recharts';
import Modal from '../components/Modal';
import StatCard from '../components/StatCard';
import { investmentService } from '../services/investmentService';
import { toast } from 'react-toastify';

const INVESTMENT_TYPES = ['Stocks', 'Mutual Funds', 'Gold', 'Crypto', 'FD', 'Real Estate'];
const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

const Investments = () => {
  const [investments, setInvestments] = useState([]);
  const [summary, setSummary] = useState({
    totalInvested: 0,
    totalCurrentValue: 0,
    totalProfitLoss: 0,
    portfolioReturnPct: 0,
  });
  const [distributionChart, setDistributionChart] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form & Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingInvestment, setEditingInvestment] = useState(null);
  const [form, setForm] = useState({
    name: '',
    type: 'Stocks',
    investedAmount: '',
    currentValue: '',
  });

  const fetchInvestments = async () => {
    try {
      setLoading(true);
      const res = await investmentService.getInvestments();
      if (res.success) {
        setInvestments(res.data);
        setSummary(res.summary);
        setDistributionChart(res.distributionChart || []);
      }
    } catch (err) {
      toast.error('Failed to load investment portfolio');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvestments();
  }, []);

  const handleOpenAddModal = () => {
    setEditingInvestment(null);
    setForm({ name: '', type: 'Stocks', investedAmount: '', currentValue: '' });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (inv) => {
    setEditingInvestment(inv);
    setForm({
      name: inv.name || inv.assetName || '',
      type: inv.type || 'Stocks',
      investedAmount: inv.investedAmount,
      currentValue: inv.currentValue,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.name || !form.type || form.investedAmount === '' || form.currentValue === '') {
      toast.error('Please fill in asset name, type, invested amount, and current value');
      return;
    }
    if (Number(form.investedAmount) < 0 || Number(form.currentValue) < 0) {
      toast.error('Amounts cannot be negative');
      return;
    }

    try {
      if (editingInvestment) {
        const res = await investmentService.updateInvestment(editingInvestment._id, form);
        if (res.success) {
          toast.success('Investment updated!');
          setIsModalOpen(false);
          fetchInvestments();
        }
      } else {
        const res = await investmentService.createInvestment(form);
        if (res.success) {
          toast.success('New investment added!');
          setIsModalOpen(false);
          fetchInvestments();
        }
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Action failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this investment asset?')) return;
    try {
      const res = await investmentService.deleteInvestment(id);
      if (res.success) {
        toast.success('Investment asset deleted');
        fetchInvestments();
      }
    } catch (err) {
      toast.error('Failed to delete investment');
    }
  };

  const isProfit = summary.totalProfitLoss >= 0;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Investment Portfolio Tracker
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor asset allocation across Stocks, Mutual Funds, Gold, Crypto, FD & Real Estate
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs transition-all shadow-md shadow-amber-500/20 self-start sm:self-auto cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add Investment Asset</span>
        </button>
      </div>

      {/* Summary Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          title="Total Portfolio Valuation"
          value={`$${(summary.totalCurrentValue || 0).toLocaleString()}`}
          icon={FiPieChart}
          color="amber"
          subtext="Combined market value of all holdings"
        />

        <StatCard
          title="Total Capital Invested"
          value={`$${(summary.totalInvested || 0).toLocaleString()}`}
          icon={FiDollarSign}
          color="blue"
          subtext="Initial principal cost basis"
        />

        <StatCard
          title="Net Portfolio Profit / Loss"
          value={`${isProfit ? '+' : ''}$${(summary.totalProfitLoss || 0).toLocaleString()} (${summary.portfolioReturnPct || 0}%)`}
          icon={isProfit ? FiTrendingUp : FiTrendingDown}
          color={isProfit ? 'emerald' : 'rose'}
          subtext="Unrealized ROI returns"
        />
      </div>

      {/* Investment Distribution Chart Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center gap-2 mb-4">
          <FiPieChart className="text-amber-500 w-5 h-5" />
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Investment Distribution Chart
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Portfolio allocation breakdown by asset class
            </p>
          </div>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={distributionChart}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={5}
                dataKey="value"
                nameKey="name"
              >
                {distributionChart.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Valuation']}
              />
              <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Holdings Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden shadow-xs">
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Asset Holdings & Performance ({investments.length})
          </h3>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-amber-500" />
          </div>
        ) : investments.length === 0 ? (
          <div className="p-12 text-center text-slate-400 text-xs italic">
            No investment assets found. Click "Add Investment Asset" to start tracking your portfolio.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] uppercase font-bold text-slate-400 bg-slate-50/50 dark:bg-slate-900/50">
                  <th className="py-3.5 px-6">Asset Name</th>
                  <th className="py-3.5 px-6">Type</th>
                  <th className="py-3.5 px-6">Invested</th>
                  <th className="py-3.5 px-6">Current Value</th>
                  <th className="py-3.5 px-6">Profit / Loss</th>
                  <th className="py-3.5 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 text-xs font-medium">
                {investments.map((inv) => {
                  const invested = inv.investedAmount || 0;
                  const current = inv.currentValue || 0;
                  const pl = inv.profitLoss ?? (current - invested);
                  const plPct = invested > 0 ? ((pl / invested) * 100).toFixed(2) : 0;
                  const isPositive = pl >= 0;

                  return (
                    <tr key={inv._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-4 px-6 font-bold text-slate-900 dark:text-white">
                        {inv.name || inv.assetName || 'Asset'}
                      </td>
                      <td className="py-4 px-6">
                        <span className="px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                          {inv.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-slate-600 dark:text-slate-400 font-semibold">
                        ${invested.toLocaleString()}
                      </td>
                      <td className="py-4 px-6 font-black text-slate-900 dark:text-white text-sm">
                        ${current.toLocaleString()}
                      </td>
                      <td className="py-4 px-6">
                        <span
                          className={`font-black flex items-center gap-1 ${
                            isPositive ? 'text-emerald-500' : 'text-rose-500'
                          }`}
                        >
                          {isPositive ? <FiTrendingUp className="w-3.5 h-3.5" /> : <FiTrendingDown className="w-3.5 h-3.5" />}
                          {isPositive ? '+' : ''}${pl.toLocaleString()} ({plPct}%)
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(inv)}
                          className="text-slate-400 hover:text-amber-500 p-1 transition-colors"
                          title="Edit Asset"
                        >
                          <FiEdit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(inv._id)}
                          className="text-slate-400 hover:text-rose-500 p-1 transition-colors"
                          title="Delete Asset"
                        >
                          <FiTrash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal Form */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingInvestment ? 'Edit Investment Asset' : 'Add New Investment Asset'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Asset Name
            </label>
            <input
              type="text"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="e.g. S&P 500 ETF, Bitcoin, HDFC Bank FD"
              required
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Investment Type
            </label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            >
              {INVESTMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Invested Amount ($)
            </label>
            <input
              type="number"
              value={form.investedAmount}
              onChange={(e) => setForm({ ...form, investedAmount: e.target.value })}
              placeholder="1000"
              required
              min={0}
              step="any"
              className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Current Market Value ($)
            </label>
            <input
              type="number"
              value={form.currentValue}
              onChange={(e) => setForm({ ...form, currentValue: e.target.value })}
              placeholder="1250"
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
              className="px-4 py-2 text-xs font-bold bg-amber-500 text-white rounded-xl hover:bg-amber-600"
            >
              {editingInvestment ? 'Update Asset' : 'Save Asset'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default Investments;
