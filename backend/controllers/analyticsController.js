import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import Investment from '../models/Investment.js';
import Budget from '../models/Budget.js';
import Transaction from '../models/Transaction.js';
import WealthAsset from '../models/WealthAsset.js';

// @desc    Get comprehensive dashboard analytics & wealth projections
// @route   GET /api/analytics/dashboard
// @access  Private
export const getDashboardAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Fetch collections for user
    const [incomes, expenses, habits, goals, investments, budgets, transactions, wealthAssets] = await Promise.all([
      Income.find({ userId }),
      Expense.find({ userId }),
      Habit.find({ userId }),
      Goal.find({ userId }),
      Investment.find({ userId }),
      Budget.find({ userId }),
      Transaction.find({ user: userId }),
      WealthAsset.find({ user: userId }),
    ]);

    // Financial Totals
    const totalIncome = incomes.reduce((sum, i) => sum + i.amount, 0) +
      transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = expenses.reduce((sum, e) => sum + e.amount, 0) +
      transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);

    const totalInvested = investments.reduce((sum, inv) => sum + inv.investedAmount, 0) +
      wealthAssets.reduce((sum, w) => sum + w.initialValue, 0);

    const totalInvestmentValue = investments.reduce((sum, inv) => sum + inv.currentValue, 0) +
      wealthAssets.reduce((sum, w) => sum + w.currentValue, 0);

    const netSavings = Math.max(0, totalIncome - totalExpense);
    const currentBalance = totalIncome - totalExpense + totalInvestmentValue;

    // Budget Remaining
    const totalBudgetLimit = budgets.reduce((sum, b) => sum + b.budget, 0);
    const totalBudgetSpent = budgets.reduce((sum, b) => sum + b.spent, 0);
    const budgetRemaining = Math.max(0, totalBudgetLimit - totalBudgetSpent);

    // Goal Progress %
    const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
    const totalGoalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
    const goalProgressPct = totalGoalTarget > 0 ? Math.min(100, Math.round((totalGoalSaved / totalGoalTarget) * 100)) : 0;

    // Habit Completion %
    const todayStr = new Date().toISOString().split('T')[0];
    const completedTodayCount = habits.filter((h) => h.completedDays?.includes(todayStr)).length;
    const habitCompletionPct = habits.length > 0 ? Math.round((completedTodayCount / habits.length) * 100) : 0;

    // Financial Health Score (0-100)
    let healthScore = 50;
    const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;
    if (savingsRate >= 20) healthScore += 20;
    else if (savingsRate >= 10) healthScore += 10;
    if (goalProgressPct > 50) healthScore += 15;
    if (habitCompletionPct > 50) healthScore += 15;
    healthScore = Math.min(100, healthScore);

    // Investment Distribution for Pie Chart
    const distMap = {};
    investments.forEach((inv) => {
      distMap[inv.type] = (distMap[inv.type] || 0) + inv.currentValue;
    });
    wealthAssets.forEach((w) => {
      const type = w.assetType || 'Other';
      distMap[type] = (distMap[type] || 0) + w.currentValue;
    });
    const investmentDistribution = Object.keys(distMap).map((key) => ({
      name: key,
      value: distMap[key],
    }));

    // Monthly Chart Data (Mock / Calculated by month)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const currentMonthIdx = new Date().getMonth();
    
    const monthlyExpenseData = months.slice(0, currentMonthIdx + 1).map((m, idx) => ({
      month: m,
      expenses: Math.round((totalExpense / (currentMonthIdx + 1)) * (0.8 + (idx * 0.05))),
    }));

    const incomeTrendData = months.slice(0, currentMonthIdx + 1).map((m, idx) => ({
      month: m,
      income: Math.round((totalIncome / (currentMonthIdx + 1)) * (0.9 + (idx * 0.03))),
    }));

    const savingsTrendData = months.slice(0, currentMonthIdx + 1).map((m, idx) => ({
      month: m,
      savings: Math.round((netSavings / (currentMonthIdx + 1)) * (0.85 + (idx * 0.04))),
    }));

    // 10-Year Compound Wealth Growth
    const r = 0.08;
    const wealthGrowthProjections = [];
    for (let year = 1; year <= 10; year++) {
      const compound = totalInvestmentValue * Math.pow(1 + r, year) + (netSavings * 12 * ((Math.pow(1 + r, year) - 1) / r));
      wealthGrowthProjections.push({
        year: `Year ${year}`,
        wealth: Math.round(compound || (1000 * year * 1.5)),
      });
    }

    res.json({
      success: true,
      data: {
        summary: {
          currentBalance,
          totalIncome,
          totalExpense,
          netSavings,
          totalInvestmentValue,
          healthScore,
          goalProgressPct,
          habitCompletionPct,
          totalBudgetLimit,
          totalBudgetSpent,
          budgetRemaining,
          completedTodayCount,
          totalHabits: habits.length,
        },
        charts: {
          monthlyExpense: monthlyExpenseData.length > 0 ? monthlyExpenseData : [{ month: 'Jul', expenses: totalExpense || 500 }],
          incomeTrend: incomeTrendData.length > 0 ? incomeTrendData : [{ month: 'Jul', income: totalIncome || 2000 }],
          savingsTrend: savingsTrendData.length > 0 ? savingsTrendData : [{ month: 'Jul', savings: netSavings || 1500 }],
          wealthGrowth: wealthGrowthProjections,
          investmentDistribution: investmentDistribution.length > 0 ? investmentDistribution : [
            { name: 'Stocks', value: 5000 },
            { name: 'Crypto', value: 2000 },
            { name: 'Real Estate', value: 10000 },
            { name: 'Savings', value: 3000 },
          ],
        },
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
