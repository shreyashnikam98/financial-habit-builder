import React, { useEffect, useState } from 'react';
import {
  FiDollarSign,
  FiCreditCard,
  FiArrowUpRight,
  FiArrowDownRight,
  FiTrendingUp,
  FiPieChart,
  FiActivity,
  FiTarget,
  FiCheckSquare,
  FiBriefcase,
} from 'react-icons/fi';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from 'recharts';
import StatCard from '../components/StatCard';
import { SkeletonPage } from '../components/SkeletonLoader';
import { analyticsService } from '../services/goalService';
import { toast } from 'react-toastify';

const COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6'];

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const res = await analyticsService.getDashboardAnalytics();
      if (res.success) {
        setData(res.data);
      }
    } catch (err) {
      console.error('Dashboard error:', err);
      toast.error('Failed to load financial dashboard metrics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) {
    return <SkeletonPage />;
  }

  const summary = data?.summary || {};
  const charts = data?.charts || {};

  return (
    <div className="space-y-8 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight">
            Financial Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Real-time cashflow analytics, wealth accumulation, and habit metrics
          </p>
        </div>

        <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-4 py-2 rounded-2xl text-emerald-600 dark:text-emerald-400 font-bold text-xs self-start sm:self-auto">
          <FiActivity className="w-4 h-4 animate-pulse" />
          <span>Health Score: {summary.healthScore || 50}/100</span>
        </div>
      </div>

      {/* 9 Cards Section */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-4">
        <StatCard
          title="Current Balance"
          value={`$${(summary.currentBalance || 0).toLocaleString()}`}
          icon={FiCreditCard}
          color="emerald"
          subtext="Net liquidity & asset valuation"
        />

        <StatCard
          title="Total Income"
          value={`$${(summary.totalIncome || 0).toLocaleString()}`}
          icon={FiArrowUpRight}
          color="blue"
          subtext="Recorded revenue & cash inflows"
        />

        <StatCard
          title="Total Expenses"
          value={`$${(summary.totalExpense || 0).toLocaleString()}`}
          icon={FiArrowDownRight}
          color="rose"
          subtext="Recorded spending & cash outflows"
        />

        <StatCard
          title="Net Savings"
          value={`$${(summary.netSavings || 0).toLocaleString()}`}
          icon={FiTrendingUp}
          color="purple"
          subtext="Income minus expenses"
        />

        <StatCard
          title="Total Investments"
          value={`$${(summary.totalInvestmentValue || 0).toLocaleString()}`}
          icon={FiPieChart}
          color="amber"
          subtext="Stocks, crypto & real estate assets"
        />

        <StatCard
          title="Financial Score"
          value={`${summary.healthScore || 50}/100`}
          icon={FiActivity}
          color="emerald"
          subtext="AI financial health rating"
        />

        <StatCard
          title="Goal Progress"
          value={`${summary.goalProgressPct || 0}%`}
          icon={FiTarget}
          color="blue"
          subtext="Target milestones reached"
        />

        <StatCard
          title="Habit Completion"
          value={`${summary.habitCompletionPct || 0}%`}
          icon={FiCheckSquare}
          color="purple"
          subtext={`${summary.completedTodayCount || 0} / ${summary.totalHabits || 0} completed today`}
        />

        <StatCard
          title="Budget Remaining"
          value={`$${(summary.budgetRemaining || 0).toLocaleString()}`}
          icon={FiBriefcase}
          color="rose"
          subtext="Unspent monthly budget limit"
        />
      </div>

      {/* 5 Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Wealth Growth Chart (10-Year Compound) */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs lg:col-span-2">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Wealth Growth Chart (10-Year Projections)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Projected net worth compounding over 10 years at 8% annual return rate
            </p>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.wealthGrowth || []}>
                <defs>
                  <linearGradient id="colorWealth" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="year" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${v / 1000}k`} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Projected Wealth']}
                />
                <Area type="monotone" dataKey="wealth" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorWealth)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Monthly Expense Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Monthly Expense Chart
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly cash outflow breakdown
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={charts.monthlyExpense || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Expenses']}
                />
                <Bar dataKey="expenses" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Income Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Income Trend Chart
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Monthly gross revenue & income streams
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={charts.incomeTrend || []}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Income']}
                />
                <Line type="monotone" dataKey="income" stroke="#3b82f6" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 4: Savings Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Savings Trend Chart
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Net retained savings per month
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={charts.savingsTrend || []}>
                <defs>
                  <linearGradient id="colorSavings" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.2} />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Savings']}
                />
                <Area type="monotone" dataKey="savings" stroke="#8b5cf6" strokeWidth={3} fillOpacity={1} fill="url(#colorSavings)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 5: Investment Distribution Chart */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs">
          <div className="mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Investment Distribution
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Asset allocation across portfolio types
            </p>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={charts.investmentDistribution || []}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {(charts.investmentDistribution || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '12px', color: '#fff' }}
                  formatter={(val) => [`$${Number(val).toLocaleString()}`, 'Value']}
                />
                <Legend verticalAlign="bottom" height={36} wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
