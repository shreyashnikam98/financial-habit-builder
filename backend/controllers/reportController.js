import Income from '../models/Income.js';
import Expense from '../models/Expense.js';
import Habit from '../models/Habit.js';
import Goal from '../models/Goal.js';
import Investment from '../models/Investment.js';
import Transaction from '../models/Transaction.js';
import WealthAsset from '../models/WealthAsset.js';

// Helper to calculate date range
const getStartAndEndDates = (timeframe, refDateStr) => {
  const refDate = refDateStr ? new Date(refDateStr) : new Date();
  let startDate, endDate;

  if (timeframe === 'weekly') {
    // Start of week (Monday)
    const day = refDate.getDay();
    const diff = refDate.getDate() - day + (day === 0 ? -6 : 1);
    startDate = new Date(refDate.setDate(diff));
    startDate.setHours(0, 0, 0, 0);

    endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
  } else if (timeframe === 'yearly') {
    startDate = new Date(refDate.getFullYear(), 0, 1, 0, 0, 0, 0);
    endDate = new Date(refDate.getFullYear(), 11, 31, 23, 59, 59, 999);
  } else {
    // Default to 'monthly'
    startDate = new Date(refDate.getFullYear(), refDate.getMonth(), 1, 0, 0, 0, 0);
    endDate = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 0, 23, 59, 59, 999);
  }

  return { startDate, endDate };
};

// Helper to format Date into YYYY-MM-DD
const formatDateStr = (date) => {
  return date.toISOString().split('T')[0];
};

// @desc    Get reports data based on type, timeframe and reference date
// @route   GET /api/reports
// @access  Private
export const getReportData = async (req, res) => {
  try {
    const userId = req.user._id;
    const { type = 'income', timeframe = 'monthly', date } = req.query;

    const { startDate, endDate } = getStartAndEndDates(timeframe, date);
    
    let summary = {};
    let chartData = []; // Trend data (Bar, Line, Area)
    let pieData = [];   // Distribution data (Pie)
    let details = [];   // Table details list

    if (type === 'income') {
      // 1. Fetch Income records & Transaction (type='income') records
      const [incomes, transactions] = await Promise.all([
        Income.find({ userId, date: { $gte: startDate, $lte: endDate } }),
        Transaction.find({ user: userId, type: 'income', date: { $gte: startDate, $lte: endDate } }),
      ]);

      // Normalize details
      const rawIncomes = incomes.map(i => ({
        id: i._id,
        title: i.source,
        category: 'Income Source',
        amount: i.amount,
        date: i.date,
        notes: i.notes || '',
        sourceType: 'Direct Income',
      }));

      const rawTrans = transactions.map(t => ({
        id: t._id,
        title: t.title,
        category: t.category,
        amount: t.amount,
        date: t.date,
        notes: t.notes || '',
        sourceType: 'Transaction Log',
      }));

      details = [...rawIncomes, ...rawTrans].sort((a, b) => new Date(b.date) - new Date(a.date));

      // Calculate summaries
      const totalIncome = details.reduce((sum, item) => sum + item.amount, 0);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
      
      let averageIncome = 0;
      if (timeframe === 'weekly') {
        averageIncome = totalIncome / 7;
      } else if (timeframe === 'monthly') {
        averageIncome = totalIncome / totalDays;
      } else if (timeframe === 'yearly') {
        averageIncome = totalIncome / 12;
      }

      // Top source
      const sourceTotals = {};
      details.forEach(item => {
        const cat = item.category === 'Income Source' ? item.title : item.category;
        sourceTotals[cat] = (sourceTotals[cat] || 0) + item.amount;
      });

      let topSource = 'N/A';
      let maxSourceAmount = 0;
      Object.keys(sourceTotals).forEach(cat => {
        if (sourceTotals[cat] > maxSourceAmount) {
          maxSourceAmount = sourceTotals[cat];
          topSource = cat;
        }
      });

      summary = {
        totalIncome,
        averageIncome: Math.round(averageIncome),
        topSource,
        recordCount: details.length,
      };

      // Generate trend data
      chartData = generateTrendChartData(startDate, endDate, timeframe, details, 'amount');

      // Generate pie data
      pieData = Object.keys(sourceTotals).map(name => ({
        name,
        value: sourceTotals[name],
      })).sort((a, b) => b.value - a.value);

    } else if (type === 'expense') {
      // 2. Fetch Expense records & Transaction (type='expense') records
      const [expenses, transactions] = await Promise.all([
        Expense.find({ userId, date: { $gte: startDate, $lte: endDate } }),
        Transaction.find({ user: userId, type: 'expense', date: { $gte: startDate, $lte: endDate } }),
      ]);

      // Normalize details
      const rawExpenses = expenses.map(e => ({
        id: e._id,
        title: e.description || 'Expense',
        category: e.category,
        amount: e.amount,
        date: e.date,
        notes: e.description || '',
        sourceType: 'Direct Expense',
      }));

      const rawTrans = transactions.map(t => ({
        id: t._id,
        title: t.title,
        category: t.category,
        amount: t.amount,
        date: t.date,
        notes: t.notes || '',
        sourceType: 'Transaction Log',
      }));

      details = [...rawExpenses, ...rawTrans].sort((a, b) => new Date(b.date) - new Date(a.date));

      const totalExpenses = details.reduce((sum, item) => sum + item.amount, 0);
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;
      
      let averageExpense = 0;
      if (timeframe === 'weekly') {
        averageExpense = totalExpenses / 7;
      } else if (timeframe === 'monthly') {
        averageExpense = totalExpenses / totalDays;
      } else if (timeframe === 'yearly') {
        averageExpense = totalExpenses / 12;
      }

      // Top category
      const categoryTotals = {};
      details.forEach(item => {
        categoryTotals[item.category] = (categoryTotals[item.category] || 0) + item.amount;
      });

      let topCategory = 'N/A';
      let maxCategoryAmount = 0;
      Object.keys(categoryTotals).forEach(cat => {
        if (categoryTotals[cat] > maxCategoryAmount) {
          maxCategoryAmount = categoryTotals[cat];
          topCategory = cat;
        }
      });

      summary = {
        totalExpenses,
        averageExpense: Math.round(averageExpense),
        topCategory,
        recordCount: details.length,
      };

      // Trend data
      chartData = generateTrendChartData(startDate, endDate, timeframe, details, 'amount');

      // Pie data
      pieData = Object.keys(categoryTotals).map(name => ({
        name,
        value: categoryTotals[name],
      })).sort((a, b) => b.value - a.value);

    } else if (type === 'savings') {
      // 3. Savings report: Income vs Expense
      const [incomes, directExpenses, transactions] = await Promise.all([
        Income.find({ userId, date: { $gte: startDate, $lte: endDate } }),
        Expense.find({ userId, date: { $gte: startDate, $lte: endDate } }),
        Transaction.find({ user: userId, date: { $gte: startDate, $lte: endDate } }),
      ]);

      // Normalize incomes
      const incList = [
        ...incomes.map(i => ({ amount: i.amount, date: i.date })),
        ...transactions.filter(t => t.type === 'income').map(t => ({ amount: t.amount, date: t.date })),
      ];

      // Normalize expenses
      const expList = [
        ...directExpenses.map(e => ({ amount: e.amount, date: e.date })),
        ...transactions.filter(t => t.type === 'expense').map(t => ({ amount: t.amount, date: t.date })),
      ];

      // Sum values
      const totalIncome = incList.reduce((sum, item) => sum + item.amount, 0);
      const totalExpenses = expList.reduce((sum, item) => sum + item.amount, 0);
      const netSavings = totalIncome - totalExpenses;
      const savingsRate = totalIncome > 0 ? Math.round((netSavings / totalIncome) * 100) : 0;

      summary = {
        totalIncome,
        totalExpenses,
        netSavings,
        savingsRate,
      };

      // Generate Savings trend data containing both income, expense and savings
      chartData = generateSavingsTrendData(startDate, endDate, timeframe, incList, expList);

      // Pie data: Income vs Expenses vs Net Savings
      pieData = [
        { name: 'Expenses', value: totalExpenses },
        { name: 'Savings', value: Math.max(0, netSavings) },
      ];

      // Tabular list shows chronological logs of cash flows
      details = [
        ...incomes.map(i => ({ title: i.source, category: 'Income Source', type: 'Income', amount: i.amount, date: i.date })),
        ...transactions.filter(t => t.type === 'income').map(t => ({ title: t.title, category: t.category, type: 'Income', amount: t.amount, date: t.date })),
        ...directExpenses.map(e => ({ title: e.description || 'Expense', category: e.category, type: 'Expense', amount: e.amount, date: e.date })),
        ...transactions.filter(t => t.type === 'expense').map(t => ({ title: t.title, category: t.category, type: 'Expense', amount: t.amount, date: t.date })),
      ].sort((a, b) => new Date(b.date) - new Date(a.date));

    } else if (type === 'goal') {
      // 4. Goals report (fetches all goals to evaluate targets)
      const goals = await Goal.find({ userId });

      details = goals.map(g => ({
        id: g._id,
        title: g.goalName,
        targetAmount: g.targetAmount,
        savedAmount: g.savedAmount,
        progress: g.targetAmount > 0 ? Math.round((g.savedAmount / g.targetAmount) * 100) : 0,
        deadline: g.deadline,
        status: g.status,
      }));

      const totalGoalsCount = goals.length;
      const achievedGoals = goals.filter(g => g.status === 'Achieved').length;
      const totalGoalTarget = goals.reduce((sum, g) => sum + g.targetAmount, 0);
      const totalGoalSaved = goals.reduce((sum, g) => sum + g.savedAmount, 0);
      const overallProgress = totalGoalTarget > 0 ? Math.round((totalGoalSaved / totalGoalTarget) * 100) : 0;

      summary = {
        totalGoals: totalGoalsCount,
        achievedGoals,
        totalGoalTarget,
        totalGoalSaved,
        overallProgress,
      };

      // Chart data: Target vs Saved per Goal
      chartData = details.map(d => ({
        label: d.title.length > 12 ? d.title.substring(0, 12) + '...' : d.title,
        target: d.targetAmount,
        saved: d.savedAmount,
      }));

      // Pie chart: Goals status count
      const statusCounts = {};
      goals.forEach(g => {
        statusCounts[g.status] = (statusCounts[g.status] || 0) + 1;
      });

      pieData = Object.keys(statusCounts).map(status => ({
        name: status,
        value: statusCounts[status],
      }));

    } else if (type === 'habit') {
      // 5. Habits report
      const habits = await Habit.find({ userId });
      const totalDays = Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24)) || 1;

      // Group completions day by day
      const dayCompletions = {};
      let totalCompletionsInRange = 0;

      details = habits.map(h => {
        // Find completions of this habit within the selected date range
        const completionsInRange = h.completedDays.filter(dayStr => {
          const dayDate = new Date(dayStr);
          return dayDate >= startDate && dayDate <= endDate;
        });

        completionsInRange.forEach(dayStr => {
          dayCompletions[dayStr] = (dayCompletions[dayStr] || 0) + 1;
          totalCompletionsInRange++;
        });

        const rate = totalDays > 0 ? Math.round((completionsInRange.length / totalDays) * 100) : 0;

        return {
          id: h._id,
          title: h.habitName,
          frequency: h.frequency,
          target: h.target,
          currentStreak: h.currentStreak,
          longestStreak: h.longestStreak,
          completionsCount: completionsInRange.length,
          completionRate: Math.min(100, rate),
        };
      });

      // Find top/most consistent habit
      let mostConsistentHabit = 'N/A';
      let highestRate = -1;
      details.forEach(h => {
        if (h.completionRate > highestRate) {
          highestRate = h.completionRate;
          mostConsistentHabit = h.title;
        }
      });

      const avgCompletionRate = details.length > 0 
        ? Math.round(details.reduce((sum, h) => sum + h.completionRate, 0) / details.length)
        : 0;

      summary = {
        totalHabits: habits.length,
        totalCompletions: totalCompletionsInRange,
        avgCompletionRate,
        mostConsistentHabit,
      };

      // Generate habit completion trend
      chartData = generateHabitTrendData(startDate, endDate, timeframe, dayCompletions);

      // Pie chart: Habits breakdown by frequency
      const freqCounts = {};
      habits.forEach(h => {
        freqCounts[h.frequency] = (freqCounts[h.frequency] || 0) + 1;
      });

      pieData = Object.keys(freqCounts).map(freq => ({
        name: freq,
        value: freqCounts[freq],
      }));

    } else if (type === 'investment') {
      // 6. Investment & Asset report
      const [investments, wealthAssets] = await Promise.all([
        Investment.find({ userId }),
        WealthAsset.find({ user: userId }),
      ]);

      // Normalize investments details
      const directInv = investments.map(i => ({
        title: i.name,
        type: i.type,
        invested: i.investedAmount,
        current: i.currentValue,
        profit: i.profitLoss,
        roi: i.investedAmount > 0 ? Math.round((i.profitLoss / i.investedAmount) * 100) : 0,
        source: 'Investment Tracker',
      }));

      const assets = wealthAssets.map(a => ({
        title: a.name,
        type: a.assetType || 'Other',
        invested: a.initialValue,
        current: a.currentValue,
        profit: a.currentValue - a.initialValue,
        roi: a.initialValue > 0 ? Math.round(((a.currentValue - a.initialValue) / a.initialValue) * 100) : 0,
        source: 'Wealth Asset Log',
      }));

      details = [...directInv, ...assets].sort((a, b) => b.current - a.current);

      const totalInvested = details.reduce((sum, d) => sum + d.invested, 0);
      const totalCurrent = details.reduce((sum, d) => sum + d.current, 0);
      const totalProfitLoss = totalCurrent - totalInvested;
      const overallRoi = totalInvested > 0 ? Math.round((totalProfitLoss / totalInvested) * 100) : 0;

      summary = {
        totalInvested,
        totalCurrent,
        totalProfitLoss,
        overallRoi,
        assetsCount: details.length,
      };

      // Chart data: Invested vs Current for top investments
      chartData = details.map(d => ({
        label: d.title.length > 12 ? d.title.substring(0, 12) + '...' : d.title,
        invested: d.invested,
        current: d.current,
        profit: d.profit,
      }));

      // Pie chart: Breakdown by asset type
      const typeAllocations = {};
      details.forEach(d => {
        typeAllocations[d.type] = (typeAllocations[d.type] || 0) + d.current;
      });

      pieData = Object.keys(typeAllocations).map(typeKey => ({
        name: typeKey,
        value: typeAllocations[typeKey],
      })).sort((a, b) => b.value - a.value);
    }

    res.json({
      success: true,
      data: {
        timeframe,
        startDate: formatDateStr(startDate),
        endDate: formatDateStr(endDate),
        summary,
        charts: chartData,
        pie: pieData,
        details,
      },
    });

  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// HELPER: Generate Trend Chart Data points
function generateTrendChartData(startDate, endDate, timeframe, records, valueField) {
  const chartPoints = [];

  if (timeframe === 'weekly') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, idx) => {
      chartPoints.push({ label: day, amount: 0, index: idx });
    });

    records.forEach(r => {
      const date = new Date(r.date);
      // getDay is 0 (Sun) to 6 (Sat). We want Monday to be 0
      let dayIdx = date.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6; // Sunday becomes index 6
      if (dayIdx >= 0 && dayIdx < 7) {
        chartPoints[dayIdx].amount += r[valueField] || 0;
      }
    });
  } else if (timeframe === 'monthly') {
    // Group into 5 weeks of the month
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    weeks.forEach(w => {
      chartPoints.push({ label: w, amount: 0 });
    });

    records.forEach(r => {
      const date = new Date(r.date);
      const dayOfMonth = date.getDate();
      let weekIdx = 0;
      if (dayOfMonth <= 7) weekIdx = 0;
      else if (dayOfMonth <= 14) weekIdx = 1;
      else if (dayOfMonth <= 21) weekIdx = 2;
      else if (dayOfMonth <= 28) weekIdx = 3;
      else weekIdx = 4;

      chartPoints[weekIdx].amount += r[valueField] || 0;
    });
  } else if (timeframe === 'yearly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, idx) => {
      chartPoints.push({ label: m, amount: 0, index: idx });
    });

    records.forEach(r => {
      const date = new Date(r.date);
      const mIdx = date.getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        chartPoints[mIdx].amount += r[valueField] || 0;
      }
    });
  }

  // Clean indices
  chartPoints.forEach(p => {
    delete p.index;
    p.amount = Math.round(p.amount);
  });

  return chartPoints;
}

// HELPER: Generate Savings trend chart data (contains income, expense & savings)
function generateSavingsTrendData(startDate, endDate, timeframe, incomes, expenses) {
  const chartPoints = [];

  if (timeframe === 'weekly') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, idx) => {
      chartPoints.push({ label: day, income: 0, expense: 0, savings: 0, index: idx });
    });

    incomes.forEach(i => {
      const date = new Date(i.date);
      let dayIdx = date.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      if (dayIdx >= 0 && dayIdx < 7) {
        chartPoints[dayIdx].income += i.amount;
      }
    });

    expenses.forEach(e => {
      const date = new Date(e.date);
      let dayIdx = date.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      if (dayIdx >= 0 && dayIdx < 7) {
        chartPoints[dayIdx].expense += e.amount;
      }
    });
  } else if (timeframe === 'monthly') {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    weeks.forEach(w => {
      chartPoints.push({ label: w, income: 0, expense: 0, savings: 0 });
    });

    incomes.forEach(i => {
      const dayOfMonth = new Date(i.date).getDate();
      let weekIdx = 0;
      if (dayOfMonth <= 7) weekIdx = 0;
      else if (dayOfMonth <= 14) weekIdx = 1;
      else if (dayOfMonth <= 21) weekIdx = 2;
      else if (dayOfMonth <= 28) weekIdx = 3;
      else weekIdx = 4;
      chartPoints[weekIdx].income += i.amount;
    });

    expenses.forEach(e => {
      const dayOfMonth = new Date(e.date).getDate();
      let weekIdx = 0;
      if (dayOfMonth <= 7) weekIdx = 0;
      else if (dayOfMonth <= 14) weekIdx = 1;
      else if (dayOfMonth <= 21) weekIdx = 2;
      else if (dayOfMonth <= 28) weekIdx = 3;
      else weekIdx = 4;
      chartPoints[weekIdx].expense += e.amount;
    });
  } else if (timeframe === 'yearly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, idx) => {
      chartPoints.push({ label: m, income: 0, expense: 0, savings: 0, index: idx });
    });

    incomes.forEach(i => {
      const mIdx = new Date(i.date).getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        chartPoints[mIdx].income += i.amount;
      }
    });

    expenses.forEach(e => {
      const mIdx = new Date(e.date).getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        chartPoints[mIdx].expense += e.amount;
      }
    });
  }

  chartPoints.forEach(p => {
    delete p.index;
    p.income = Math.round(p.income);
    p.expense = Math.round(p.expense);
    p.savings = Math.round(p.income - p.expense);
  });

  return chartPoints;
}

// HELPER: Generate Habit completion trend data
function generateHabitTrendData(startDate, endDate, timeframe, dayCompletions) {
  const chartPoints = [];

  if (timeframe === 'weekly') {
    const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    days.forEach((day, idx) => {
      chartPoints.push({ label: day, completions: 0, index: idx });
    });

    Object.keys(dayCompletions).forEach(dayStr => {
      const date = new Date(dayStr);
      let dayIdx = date.getDay() - 1;
      if (dayIdx < 0) dayIdx = 6;
      if (dayIdx >= 0 && dayIdx < 7) {
        chartPoints[dayIdx].completions += dayCompletions[dayStr];
      }
    });
  } else if (timeframe === 'monthly') {
    const weeks = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'];
    weeks.forEach(w => {
      chartPoints.push({ label: w, completions: 0 });
    });

    Object.keys(dayCompletions).forEach(dayStr => {
      const dayOfMonth = new Date(dayStr).getDate();
      let weekIdx = 0;
      if (dayOfMonth <= 7) weekIdx = 0;
      else if (dayOfMonth <= 14) weekIdx = 1;
      else if (dayOfMonth <= 21) weekIdx = 2;
      else if (dayOfMonth <= 28) weekIdx = 3;
      else weekIdx = 4;

      chartPoints[weekIdx].completions += dayCompletions[dayStr];
    });
  } else if (timeframe === 'yearly') {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    months.forEach((m, idx) => {
      chartPoints.push({ label: m, completions: 0, index: idx });
    });

    Object.keys(dayCompletions).forEach(dayStr => {
      const mIdx = new Date(dayStr).getMonth();
      if (mIdx >= 0 && mIdx < 12) {
        chartPoints[mIdx].completions += dayCompletions[dayStr];
      }
    });
  }

  chartPoints.forEach(p => {
    delete p.index;
  });

  return chartPoints;
}
