import React, { useEffect, useState, useMemo, useCallback } from 'react';
import {
  FiArrowUpRight,
  FiArrowDownRight,
  FiDollarSign,
  FiTarget,
  FiCheckSquare,
  FiTrendingUp,
  FiCalendar,
  FiChevronLeft,
  FiChevronRight,
  FiDownload,
  FiFileText,
  FiActivity,
  FiPercent,
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
import { reportService } from '../services/reportService';
import { toast } from 'react-toastify';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';

const CHART_COLORS = ['#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ec4899', '#14b8a6', '#6366f1', '#f43f5e'];

const Reports = () => {
  // Page states
  const [reportType, setReportType] = useState('income'); // income, expense, savings, goal, habit, investment
  const [timeframe, setTimeframe] = useState('monthly'); // weekly, monthly, yearly
  const [currentDate, setCurrentDate] = useState(new Date());
  const [chartType, setChartType] = useState('bar'); // pie, bar, area, line
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);
  
  // Table pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Format active date range for title
  const dateRangeLabel = useMemo(() => {
    if (!data) return '';
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    
    if (timeframe === 'weekly') {
      return `${start.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${end.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}`;
    } else if (timeframe === 'monthly') {
      return start.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    } else {
      return start.toLocaleDateString(undefined, { year: 'numeric' });
    }
  }, [data, timeframe]);

  // Fetch report data
  const fetchReport = useCallback(async () => {
    try {
      setLoading(true);
      const apiDateStr = currentDate.toISOString().split('T')[0];
      const res = await reportService.getReportData(reportType, timeframe, apiDateStr);
      if (res.success) {
        setData(res.data);
        setCurrentPage(1); // Reset page on query reload
      }
    } catch (err) {
      console.error('Reports fetch error:', err);
      toast.error('Failed to retrieve reporting metrics');
    } finally {
      setLoading(false);
    }
  }, [reportType, timeframe, currentDate]);

  useEffect(() => {
    fetchReport();
  }, [fetchReport]);

  // Handle Date shifts
  const shiftDate = (direction) => {
    const newDate = new Date(currentDate);
    if (timeframe === 'weekly') {
      newDate.setDate(currentDate.getDate() + (direction * 7));
    } else if (timeframe === 'monthly') {
      newDate.setMonth(currentDate.getMonth() + direction);
    } else if (timeframe === 'yearly') {
      newDate.setFullYear(currentDate.getFullYear() + direction);
    }
    setCurrentDate(newDate);
  };

  const setToday = () => {
    setCurrentDate(new Date());
  };

  // Helper to format values
  const formatCurrency = (val) => {
    return typeof val === 'number' ? `$${val.toLocaleString()}` : '$0';
  };

  // 1. Export PDF Function
  const exportPDF = () => {
    if (!data) return;
    
    try {
      const doc = new jsPDF();
      
      // Document Header
      doc.setFontSize(22);
      doc.setTextColor(16, 185, 129); // Emerald Theme Color
      doc.text(`${reportType.toUpperCase()} FINANCIAL REPORT`, 14, 20);
      
      doc.setFontSize(10);
      doc.setTextColor(100, 116, 139); // Slate Grey
      doc.text(`Timeframe: ${timeframe.toUpperCase()}`, 14, 28);
      doc.text(`Report Period: ${data.startDate} to ${data.endDate}`, 14, 34);
      doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 40);
      
      // Summary KPIs Box
      doc.setFillColor(248, 250, 252);
      doc.rect(14, 45, 182, 35, 'F');
      
      doc.setFontSize(12);
      doc.setTextColor(15, 23, 42); // Slate 900
      doc.text('Key Summary Metrics:', 20, 52);
      
      doc.setFontSize(10);
      doc.setTextColor(51, 65, 85); // Slate 700
      let yOffset = 58;
      
      Object.entries(data.summary).forEach(([key, value]) => {
        const readableKey = key.replace(/([A-Z])/g, ' $1').toUpperCase();
        let displayVal = value;
        
        if (typeof value === 'number') {
          if (key.toLowerCase().includes('total') || key.toLowerCase().includes('amount') || key.toLowerCase().includes('current') || key.toLowerCase().includes('invested') || key.toLowerCase().includes('savings') || key.toLowerCase().includes('expense') || key.toLowerCase().includes('income')) {
            displayVal = `$${value.toLocaleString()}`;
          } else if (key.toLowerCase().includes('rate') || key.toLowerCase().includes('progress') || key.toLowerCase().includes('roi')) {
            displayVal = `${value}%`;
          }
        }
        
        doc.text(`${readableKey}: ${displayVal}`, 20, yOffset);
        yOffset += 6;
      });

      // Map details to Table rows based on report type
      let headers = [];
      let bodyRows = [];
      
      if (reportType === 'income' || reportType === 'expense') {
        headers = ['Date', 'Title', 'Category', 'Source Log', 'Amount'];
        bodyRows = data.details.map(item => [
          new Date(item.date).toLocaleDateString(),
          item.title,
          item.category,
          item.sourceType,
          `$${item.amount.toLocaleString()}`,
        ]);
      } else if (reportType === 'savings') {
        headers = ['Date', 'Title', 'Category', 'Type', 'Amount'];
        bodyRows = data.details.map(item => [
          new Date(item.date).toLocaleDateString(),
          item.title,
          item.category,
          item.type,
          `$${item.amount.toLocaleString()}`,
        ]);
      } else if (reportType === 'goal') {
        headers = ['Goal Title', 'Target Amount', 'Saved Amount', 'Progress', 'Deadline', 'Status'];
        bodyRows = data.details.map(item => [
          item.title,
          `$${item.targetAmount.toLocaleString()}`,
          `$${item.savedAmount.toLocaleString()}`,
          `${item.progress}%`,
          new Date(item.deadline).toLocaleDateString(),
          item.status,
        ]);
      } else if (reportType === 'habit') {
        headers = ['Habit Name', 'Frequency', 'Current Streak', 'Longest Streak', 'Completions', 'Completion Rate'];
        bodyRows = data.details.map(item => [
          item.title,
          item.frequency,
          `${item.currentStreak} days`,
          `${item.longestStreak} days`,
          item.completionsCount,
          `${item.completionRate}%`,
        ]);
      } else if (reportType === 'investment') {
        headers = ['Asset Name', 'Asset Type', 'Invested Amount', 'Current Value', 'Gain / Loss', 'ROI %'];
        bodyRows = data.details.map(item => [
          item.title,
          item.type,
          `$${item.invested.toLocaleString()}`,
          `$${item.current.toLocaleString()}`,
          `$${item.profit.toLocaleString()}`,
          `${item.roi}%`,
        ]);
      }

      // Generate Table PDF
      doc.autoTable({
        startY: 88,
        head: [headers],
        body: bodyRows,
        theme: 'grid',
        headStyles: { fillColor: [16, 185, 129] }, // Emerald Primary Header Color
        alternateRowStyles: { fillColor: [248, 250, 252] },
        styles: { fontSize: 9, cellPadding: 3 },
      });
      
      doc.save(`${reportType}_report_${timeframe}_${data.startDate}.pdf`);
      toast.success('PDF report exported successfully!');
    } catch (err) {
      console.error('PDF export error:', err);
      toast.error('Failed to generate PDF document');
    }
  };

  // 2. Export Excel Function
  const exportExcel = () => {
    if (!data) return;
    
    try {
      const wb = XLSX.utils.book_new();
      
      // Prepare Sheet 1: Report KPI Summary
      const summaryRows = Object.entries(data.summary).map(([key, value]) => ({
        Metric: key.replace(/([A-Z])/g, ' $1').toUpperCase(),
        Value: value,
      }));
      const wsSummary = XLSX.utils.json_to_sheet(summaryRows);
      XLSX.utils.book_append_sheet(wb, wsSummary, 'Summary Overview');
      
      // Prepare Sheet 2: Tabular records
      let detailsRows = [];
      if (reportType === 'income' || reportType === 'expense') {
        detailsRows = data.details.map(item => ({
          Date: new Date(item.date).toLocaleDateString(),
          Title: item.title,
          Category: item.category,
          'Log Source': item.sourceType,
          Amount: item.amount,
        }));
      } else if (reportType === 'savings') {
        detailsRows = data.details.map(item => ({
          Date: new Date(item.date).toLocaleDateString(),
          Title: item.title,
          Category: item.category,
          Type: item.type,
          Amount: item.amount,
        }));
      } else if (reportType === 'goal') {
        detailsRows = data.details.map(item => ({
          'Goal Name': item.title,
          'Target Amount': item.targetAmount,
          'Saved Amount': item.savedAmount,
          'Progress %': item.progress,
          Deadline: new Date(item.deadline).toLocaleDateString(),
          Status: item.status,
        }));
      } else if (reportType === 'habit') {
        detailsRows = data.details.map(item => ({
          'Habit Name': item.title,
          Frequency: item.frequency,
          'Current Streak': item.currentStreak,
          'Longest Streak': item.longestStreak,
          'Completions Count': item.completionsCount,
          'Completion Rate %': item.completionRate,
        }));
      } else if (reportType === 'investment') {
        detailsRows = data.details.map(item => ({
          'Asset Name': item.title,
          Type: item.type,
          'Invested Amount': item.invested,
          'Current Value': item.current,
          'Profit / Loss': item.profit,
          'ROI %': item.roi,
          Source: item.source,
        }));
      }

      const wsDetails = XLSX.utils.json_to_sheet(detailsRows);
      XLSX.utils.book_append_sheet(wb, wsDetails, 'Detailed Records');
      
      // Save sheet
      XLSX.writeFile(wb, `${reportType}_report_${timeframe}_${data.startDate}.xlsx`);
      toast.success('Excel spreadsheet exported successfully!');
    } catch (err) {
      console.error('Excel export error:', err);
      toast.error('Failed to generate Excel spreadsheet');
    }
  };

  // Paginated Details list
  const paginatedDetails = useMemo(() => {
    if (!data?.details) return [];
    const startIndex = (currentPage - 1) * itemsPerPage;
    return data.details.slice(startIndex, startIndex + itemsPerPage);
  }, [data, currentPage]);

  const totalPages = useMemo(() => {
    if (!data?.details) return 1;
    return Math.ceil(data.details.length / itemsPerPage) || 1;
  }, [data]);

  // Render dynamic KPI Cards depending on selected type
  const renderKPICards = () => {
    if (!data) return null;
    const summary = data.summary;

    let kpis = [];

    if (reportType === 'income') {
      kpis = [
        { title: 'Total Inflow', value: formatCurrency(summary.totalIncome), subtext: 'Total income streams in timeframe', icon: FiArrowUpRight, border: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' },
        { title: 'Inflow Average', value: formatCurrency(summary.averageIncome), subtext: `Avg per ${timeframe === 'weekly' ? 'day' : timeframe === 'monthly' ? 'day' : 'month'}`, icon: FiDollarSign, border: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5' },
        { title: 'Primary Source', value: summary.topSource, subtext: 'Top grossing channel', icon: FiTrendingUp, border: 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5' },
        { title: 'Transaction Entries', value: summary.recordCount, subtext: 'Inflow item logging entries count', icon: FiFileText, border: 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5' },
      ];
    } else if (reportType === 'expense') {
      kpis = [
        { title: 'Total Expenses', value: formatCurrency(summary.totalExpenses), subtext: 'Total money spent in timeframe', icon: FiArrowDownRight, border: 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5' },
        { title: 'Outflow Average', value: formatCurrency(summary.averageExpense), subtext: `Avg per ${timeframe === 'weekly' ? 'day' : timeframe === 'monthly' ? 'day' : 'month'}`, icon: FiDollarSign, border: 'border-orange-500/20 text-orange-600 dark:text-orange-400 bg-orange-500/5' },
        { title: 'Top Category', value: summary.topCategory, subtext: 'Highest expenditure division', icon: FiTrendingUp, border: 'border-pink-500/20 text-pink-600 dark:text-pink-400 bg-pink-500/5' },
        { title: 'Payment Recipient Logs', value: summary.recordCount, subtext: 'Expense logging items', icon: FiFileText, border: 'border-teal-500/20 text-teal-600 dark:text-teal-400 bg-teal-500/5' },
      ];
    } else if (reportType === 'savings') {
      const isPositive = summary.netSavings >= 0;
      kpis = [
        { title: 'Total Income Stream', value: formatCurrency(summary.totalIncome), subtext: 'Gross combined cash inflows', icon: FiArrowUpRight, border: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5' },
        { title: 'Total Expense Flow', value: formatCurrency(summary.totalExpenses), subtext: 'Gross combined cash outflows', icon: FiArrowDownRight, border: 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5' },
        { title: 'Net Savings', value: formatCurrency(summary.netSavings), subtext: 'Income minus expenses', icon: FiTrendingUp, border: isPositive ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5' },
        { title: 'Retained Savings Rate', value: `${summary.savingsRate}%`, subtext: 'Savings percent of gross income', icon: FiPercent, border: 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5' },
      ];
    } else if (reportType === 'goal') {
      kpis = [
        { title: 'Total Active Goals', value: summary.totalGoals, subtext: 'Financial milestones defined', icon: FiTarget, border: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5' },
        { title: 'Milestones Achieved', value: summary.achievedGoals, subtext: 'Completed targets reached', icon: FiCheckSquare, border: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' },
        { title: 'Combined Targets', value: formatCurrency(summary.totalGoalTarget), subtext: 'Sum target financial value', icon: FiDollarSign, border: 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' },
        { title: 'Completion Index', value: `${summary.overallProgress}%`, subtext: 'Combined savings progress', icon: FiPercent, border: 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5' },
      ];
    } else if (reportType === 'habit') {
      kpis = [
        { title: 'Active Habits', value: summary.totalHabits, subtext: 'Behavioral routines tracked', icon: FiCheckSquare, border: 'border-amber-500/20 text-amber-600 dark:text-amber-400 bg-amber-500/5' },
        { title: 'Total Completed Steps', value: summary.totalCompletions, subtext: 'Total completions in period', icon: FiActivity, border: 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' },
        { title: 'Avg Success Index', value: `${summary.avgCompletionRate}%`, subtext: 'Average execution consistency', icon: FiPercent, border: 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' },
        { title: 'Leading Streak', value: summary.mostConsistentHabit, subtext: 'Top consistent habit in period', icon: FiTrendingUp, border: 'border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-500/5' },
      ];
    } else if (reportType === 'investment') {
      const profitVal = summary.totalProfitLoss;
      const isPositive = profitVal >= 0;
      kpis = [
        { title: 'Initial Invested Principal', value: formatCurrency(summary.totalInvested), subtext: 'Base purchase capital valuation', icon: FiDollarSign, border: 'border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/5' },
        { title: 'Portfolio Net Valuation', value: formatCurrency(summary.totalCurrent), subtext: 'Real-time market values', icon: FiTrendingUp, border: 'border-teal-500/20 text-teal-600 dark:text-teal-400 bg-teal-500/5' },
        { title: 'Investment Gain / Loss', value: formatCurrency(profitVal), subtext: 'Profit and yield differential', icon: isPositive ? FiArrowUpRight : FiArrowDownRight, border: isPositive ? 'border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-500/5' : 'border-rose-500/20 text-rose-600 dark:text-rose-400 bg-rose-500/5' },
        { title: 'Net Portfolio Yield (ROI)', value: `${summary.overallRoi}%`, subtext: 'Gross yield rate percentage', icon: FiPercent, border: 'border-purple-500/20 text-purple-600 dark:text-purple-400 bg-purple-500/5' },
      ];
    }

    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <div
              key={index}
              className={`bg-white dark:bg-slate-900 border ${kpi.border} rounded-2xl p-5 transition-all duration-300 hover:shadow-md flex items-center justify-between gap-4`}
            >
              <div className="space-y-1.5 overflow-hidden">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-semibold uppercase tracking-wider truncate">
                  {kpi.title}
                </p>
                <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white leading-tight truncate">
                  {kpi.value}
                </h3>
                <p className="text-xxs sm:text-xs text-slate-400 dark:text-slate-500 truncate">
                  {kpi.subtext}
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-white dark:bg-slate-800 shadow-xs border border-slate-100 dark:border-slate-700/50 shrink-0">
                <Icon className="w-5 h-5" />
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  // Render appropriate Chart based on types
  const renderChart = () => {
    if (!data) return null;

    // 1. Render Pie Chart
    if (chartType === 'pie') {
      const emptyPie = !data.pie || data.pie.length === 0;
      const pieDataPoints = emptyPie 
        ? [{ name: 'No Data available', value: 1 }] 
        : data.pie;

      return (
        <div className="h-80 w-full flex items-center justify-center">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={pieDataPoints}
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={95}
                paddingAngle={4}
                dataKey="value"
              >
                {pieDataPoints.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={emptyPie ? '#64748b' : CHART_COLORS[index % CHART_COLORS.length]} 
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(val, name) => [
                  emptyPie ? '0' : reportType === 'savings' || reportType === 'income' || reportType === 'expense' || reportType === 'investment' 
                    ? `$${Number(val).toLocaleString()}` 
                    : `${val} counts`, 
                  name
                ]}
              />
              <Legend 
                verticalAlign="bottom" 
                height={40} 
                wrapperStyle={{ fontSize: '12px', color: '#94a3b8' }} 
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // Prepare charts variables
    let trendData = [];
    let barKeys = [];
    let areaKeys = [];
    let lineKeys = [];
    let yTickFormatter = (v) => v;

    if (reportType === 'income' || reportType === 'expense') {
      trendData = data.charts || [];
      barKeys = [{ key: 'amount', color: reportType === 'income' ? '#10b981' : '#f43f5e', name: reportType === 'income' ? 'Income' : 'Expenses' }];
      areaKeys = barKeys;
      lineKeys = barKeys;
      yTickFormatter = (v) => `$${v.toLocaleString()}`;
    } else if (reportType === 'savings') {
      trendData = data.charts || [];
      barKeys = [
        { key: 'income', color: '#3b82f6', name: 'Inflow' },
        { key: 'expense', color: '#f43f5e', name: 'Outflow' },
        { key: 'savings', color: '#8b5cf6', name: 'Net Savings' }
      ];
      areaKeys = [{ key: 'savings', color: '#8b5cf6', name: 'Net Savings' }];
      lineKeys = areaKeys;
      yTickFormatter = (v) => `$${v.toLocaleString()}`;
    } else if (reportType === 'goal') {
      trendData = data.charts || [];
      barKeys = [
        { key: 'target', color: '#3b82f6', name: 'Target Target' },
        { key: 'saved', color: '#10b981', name: 'Total Saved' }
      ];
      areaKeys = [{ key: 'saved', color: '#10b981', name: 'Saved Amount' }];
      lineKeys = areaKeys;
      yTickFormatter = (v) => `$${v.toLocaleString()}`;
    } else if (reportType === 'habit') {
      trendData = data.charts || [];
      barKeys = [{ key: 'completions', color: '#f59e0b', name: 'Habits Completed' }];
      areaKeys = barKeys;
      lineKeys = barKeys;
      yTickFormatter = (v) => `${v}`;
    } else if (reportType === 'investment') {
      trendData = data.charts || [];
      barKeys = [
        { key: 'invested', color: '#6366f1', name: 'Principal Invested' },
        { key: 'current', color: '#14b8a6', name: 'Market Value' }
      ];
      areaKeys = [{ key: 'profit', color: '#10b981', name: 'Yield Value Growth' }];
      lineKeys = areaKeys;
      yTickFormatter = (v) => `$${v.toLocaleString()}`;
    }

    if (trendData.length === 0) {
      return (
        <div className="h-80 flex items-center justify-center text-slate-400 dark:text-slate-500 font-medium">
          No sufficient graphical trend points available for this period.
        </div>
      );
    }

    // 2. Render Bar Chart
    if (chartType === 'bar') {
      return (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={yTickFormatter} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(val) => [
                  reportType === 'habit' ? `${val} completed` : `$${Number(val).toLocaleString()}`, 
                  ''
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              {barKeys.map((bk, i) => (
                <Bar key={i} dataKey={bk.key} fill={bk.color} name={bk.name} radius={[6, 6, 0, 0]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 3. Render Area Chart
    if (chartType === 'area') {
      return (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={trendData}>
              <defs>
                {areaKeys.map((ak, i) => (
                  <linearGradient key={i} id={`colorGrad-${i}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={ak.color} stopOpacity={0.35} />
                    <stop offset="95%" stopColor={ak.color} stopOpacity={0.0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={yTickFormatter} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(val) => [
                  reportType === 'habit' ? `${val} completed` : `$${Number(val).toLocaleString()}`, 
                  ''
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              {areaKeys.map((ak, i) => (
                <Area
                  key={i}
                  type="monotone"
                  dataKey={ak.key}
                  stroke={ak.color}
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill={`url(#colorGrad-${i})`}
                  name={ak.name}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </div>
      );
    }

    // 4. Render Line Chart
    if (chartType === 'line') {
      return (
        <div className="h-80 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.15} />
              <XAxis dataKey="label" stroke="#94a3b8" fontSize={11} tickLine={false} />
              <YAxis stroke="#94a3b8" fontSize={11} tickFormatter={yTickFormatter} tickLine={false} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0f172a',
                  borderColor: '#334155',
                  borderRadius: '12px',
                  color: '#fff',
                }}
                formatter={(val) => [
                  reportType === 'habit' ? `${val} completed` : `$${Number(val).toLocaleString()}`, 
                  ''
                ]}
              />
              <Legend wrapperStyle={{ fontSize: '11px', color: '#94a3b8' }} />
              {lineKeys.map((lk, i) => (
                <Line
                  key={i}
                  type="monotone"
                  dataKey={lk.key}
                  stroke={lk.color}
                  strokeWidth={3}
                  dot={{ r: 4, strokeWidth: 1 }}
                  activeDot={{ r: 6 }}
                  name={lk.name}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      );
    }

    return null;
  };

  // Render appropriate Table Headers and Rows
  const renderTable = () => {
    if (!data || data.details.length === 0) {
      return (
        <div className="text-center py-10 text-slate-400 dark:text-slate-500 font-medium">
          No records logged in the system during this timeframe window.
        </div>
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 dark:text-slate-500 text-xs font-semibold uppercase tracking-wider">
              {reportType === 'income' || reportType === 'expense' ? (
                <>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Title</th>
                  <th className="py-4 px-5">Category</th>
                  <th className="py-4 px-5">Log Source</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                </>
              ) : reportType === 'savings' ? (
                <>
                  <th className="py-4 px-5">Date</th>
                  <th className="py-4 px-5">Description</th>
                  <th className="py-4 px-5">Division</th>
                  <th className="py-4 px-5">Direction Type</th>
                  <th className="py-4 px-5 text-right">Amount</th>
                </>
              ) : reportType === 'goal' ? (
                <>
                  <th className="py-4 px-5">Goal Title</th>
                  <th className="py-4 px-5 text-right">Target Target</th>
                  <th className="py-4 px-5 text-right">Total Saved</th>
                  <th className="py-4 px-5 text-center">Progress</th>
                  <th className="py-4 px-5">Deadline Target</th>
                  <th className="py-4 px-5 text-center">Status</th>
                </>
              ) : reportType === 'habit' ? (
                <>
                  <th className="py-4 px-5">Habit Name</th>
                  <th className="py-4 px-5">Frequency</th>
                  <th className="py-4 px-5 text-center">Current Streak</th>
                  <th className="py-4 px-5 text-center">Longest Streak</th>
                  <th className="py-4 px-5 text-center">Completions</th>
                  <th className="py-4 px-5 text-center">Success Index</th>
                </>
              ) : reportType === 'investment' ? (
                <>
                  <th className="py-4 px-5">Asset Description</th>
                  <th className="py-4 px-5">Asset Type</th>
                  <th className="py-4 px-5 text-right">Principal Capital</th>
                  <th className="py-4 px-5 text-right">Market Value</th>
                  <th className="py-4 px-5 text-right">Net Profit</th>
                  <th className="py-4 px-5 text-center">ROI yield</th>
                </>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80 text-sm">
            {paginatedDetails.map((item, idx) => {
              const isEven = idx % 2 === 0;
              const rowBg = isEven ? 'bg-transparent' : 'bg-slate-50/20 dark:bg-slate-900/10';
              
              return (
                <tr 
                  key={item.id || idx} 
                  className={`${rowBg} text-slate-700 dark:text-slate-300 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 transition-colors`}
                >
                  {reportType === 'income' || reportType === 'expense' ? (
                    <>
                      <td className="py-3.5 px-5 font-medium whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-slate-400 font-medium text-xs">
                        {item.sourceType}
                      </td>
                      <td className={`py-3.5 px-5 text-right font-bold text-base ${reportType === 'income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(item.amount)}
                      </td>
                    </>
                  ) : reportType === 'savings' ? (
                    <>
                      <td className="py-3.5 px-5 font-medium whitespace-nowrap">
                        {new Date(item.date).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 font-semibold text-slate-900 dark:text-white max-w-xs truncate">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 font-mono">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${item.type === 'Income' ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'}`}>
                          {item.type}
                        </span>
                      </td>
                      <td className={`py-3.5 px-5 text-right font-extrabold text-base ${item.type === 'Income' ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(item.amount)}
                      </td>
                    </>
                  ) : reportType === 'goal' ? (
                    <>
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold">
                        {formatCurrency(item.targetAmount)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-semibold text-emerald-500">
                        {formatCurrency(item.savedAmount)}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-emerald-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, item.progress)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">
                            {item.progress}%
                          </span>
                        </div>
                      </td>
                      <td className="py-3.5 px-5 font-medium whitespace-nowrap text-slate-500 dark:text-slate-400">
                        {new Date(item.deadline).toLocaleDateString()}
                      </td>
                      <td className="py-3.5 px-5 text-center">
                        <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xxs font-bold uppercase tracking-wider ${
                          item.status === 'Achieved' 
                            ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' 
                            : item.status === 'In Progress' 
                            ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' 
                            : 'bg-rose-500/10 text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.status}
                        </span>
                      </td>
                    </>
                  ) : reportType === 'habit' ? (
                    <>
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 text-xs font-semibold">
                          {item.frequency}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-amber-500 font-mono">
                        {item.currentStreak} 🔥
                      </td>
                      <td className="py-3.5 px-5 text-center font-bold text-indigo-500 font-mono">
                        {item.longestStreak} ⭐
                      </td>
                      <td className="py-3.5 px-5 text-center font-extrabold text-slate-900 dark:text-white">
                        {item.completionsCount}
                      </td>
                      <td className="py-3.5 px-5">
                        <div className="flex items-center justify-center gap-3">
                          <div className="w-16 bg-slate-200 dark:bg-slate-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className="bg-amber-500 h-full rounded-full transition-all duration-500" 
                              style={{ width: `${Math.min(100, item.completionRate)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-500 dark:text-slate-400 w-8 text-right">
                            {item.completionRate}%
                          </span>
                        </div>
                      </td>
                    </>
                  ) : reportType === 'investment' ? (
                    <>
                      <td className="py-3.5 px-5 font-bold text-slate-900 dark:text-white truncate max-w-xs">
                        {item.title}
                      </td>
                      <td className="py-3.5 px-5">
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
                          {item.type}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right font-medium">
                        {formatCurrency(item.invested)}
                      </td>
                      <td className="py-3.5 px-5 text-right font-bold text-slate-900 dark:text-white">
                        {formatCurrency(item.current)}
                      </td>
                      <td className={`py-3.5 px-5 text-right font-extrabold ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {formatCurrency(item.profit)}
                      </td>
                      <td className={`py-3.5 px-5 text-center font-bold text-sm ${item.profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {item.roi >= 0 ? `+${item.roi}%` : `${item.roi}%`}
                      </td>
                    </>
                  ) : null}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6 pb-8">
      {/* 1. Header Area with Exports & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FiActivity className="w-7 h-7 text-emerald-500 animate-pulse" />
            <span>Habit & Wealth Reports</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
            Perform in-depth reviews of your schedules and capital trends.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={exportPDF}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 text-sm font-bold shadow-xs cursor-pointer select-none transition-colors disabled:opacity-50"
          >
            <FiFileText className="w-4 h-4 text-emerald-500" />
            <span>PDF Export</span>
          </button>
          <button
            onClick={exportExcel}
            disabled={loading || !data}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-sm font-extrabold shadow-md shadow-emerald-500/20 cursor-pointer select-none transition-all duration-200 disabled:opacity-50"
          >
            <FiDownload className="w-4 h-4" />
            <span>Excel Export</span>
          </button>
        </div>
      </div>

      {/* 2. Top-bar Filter Controls */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-4 sm:p-5 shadow-xs space-y-4">
        {/* Row 1: Report Type Pill Slider */}
        <div>
          <p className="text-xxs font-bold text-slate-400 uppercase tracking-wider mb-2">Report Division</p>
          <div className="flex flex-wrap gap-2">
            {[
              { type: 'income', label: 'Income Report', icon: FiArrowUpRight, activeClass: 'bg-emerald-500 text-white shadow-emerald-500/20' },
              { type: 'expense', label: 'Expense Report', icon: FiArrowDownRight, activeClass: 'bg-rose-500 text-white shadow-rose-500/20' },
              { type: 'savings', label: 'Savings Report', icon: FiTrendingUp, activeClass: 'bg-purple-500 text-white shadow-purple-500/20' },
              { type: 'goal', label: 'Goal Report', icon: FiTarget, activeClass: 'bg-blue-500 text-white shadow-blue-500/20' },
              { type: 'habit', label: 'Habit Report', icon: FiCheckSquare, activeClass: 'bg-amber-500 text-white shadow-amber-500/20' },
              { type: 'investment', label: 'Investment Report', icon: FiDollarSign, activeClass: 'bg-indigo-500 text-white shadow-indigo-500/20' },
            ].map((btn) => {
              const Icon = btn.icon;
              const isActive = reportType === btn.type;
              return (
                <button
                  key={btn.type}
                  onClick={() => setReportType(btn.type)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs cursor-pointer select-none transition-all duration-250 ${
                    isActive
                      ? `${btn.activeClass} shadow-md`
                      : 'bg-slate-50 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800/80 text-slate-600 dark:text-slate-400 border border-transparent hover:border-slate-200 dark:hover:border-slate-700/60'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{btn.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Row 2: Date & Period navigators */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-t border-slate-100 dark:border-slate-800/60">
          {/* Timeframe selector */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1.5 rounded-xl border border-slate-200/50 dark:border-slate-800/50 self-start">
            {[
              { type: 'weekly', label: 'Weekly' },
              { type: 'monthly', label: 'Monthly' },
              { type: 'yearly', label: 'Yearly' },
            ].map((tf) => (
              <button
                key={tf.type}
                onClick={() => setTimeframe(tf.type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                  timeframe === tf.type
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                }`}
              >
                {tf.label}
              </button>
            ))}
          </div>

          {/* Date Range Navigation */}
          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <button
              onClick={() => shiftDate(-1)}
              className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <FiChevronLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-200 font-extrabold text-sm sm:text-base border border-slate-200/40 dark:border-slate-800/35 px-4 py-2 rounded-xl bg-slate-50/50 dark:bg-slate-950/20 font-mono">
              <FiCalendar className="w-4 h-4 text-emerald-500" />
              <span>{dateRangeLabel}</span>
            </div>
            <button
              onClick={() => shiftDate(1)}
              className="p-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors cursor-pointer"
            >
              <FiChevronRight className="w-5 h-5" />
            </button>
            <button
              onClick={setToday}
              className="px-3.5 py-2 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 text-xs font-bold transition-colors cursor-pointer"
            >
              Today
            </button>
          </div>
        </div>
      </div>

      {/* 3. Loading Spinnner */}
      {loading ? (
        <div className="flex items-center justify-center py-20 min-h-[40vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-emerald-500" />
        </div>
      ) : (
        <>
          {/* 4. Display KPI Summary Cards */}
          {renderKPICards()}

          {/* 5. Chart Visualization Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800/60">
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                  Visual Analytics Chart
                </h3>
                <p className="text-xxs sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                  Dynamic visual presentation formats for the selected metrics.
                </p>
              </div>

              {/* Chart type selection buttons */}
              <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-950 p-1 rounded-xl border border-slate-200/50 dark:border-slate-800/50 self-start sm:self-auto">
                {[
                  { type: 'pie', label: 'Pie Chart' },
                  { type: 'bar', label: 'Bar Chart' },
                  { type: 'area', label: 'Area Chart' },
                  { type: 'line', label: 'Line Chart' },
                ].map((ct) => (
                  <button
                    key={ct.type}
                    onClick={() => setChartType(ct.type)}
                    className={`px-3 py-1.5 rounded-lg text-xxs sm:text-xs font-bold transition-all duration-200 cursor-pointer select-none ${
                      chartType === ct.type
                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                    }`}
                  >
                    {ct.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Display Rechart */}
            {renderChart()}
          </div>

          {/* 6. Details Table Grid Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 sm:p-6 shadow-xs space-y-4">
            <div>
              <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">
                Tabular Activity Records
              </h3>
              <p className="text-xxs sm:text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                Detailed breakdowns of constituent log events in this period range.
              </p>
            </div>

            {/* Table */}
            {renderTable()}

            {/* Pagination Controls */}
            {data && data.details.length > itemsPerPage && (
              <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800/80">
                <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">
                  Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, data.details.length)} of {data.details.length} items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <FiChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200 font-mono">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-600 dark:text-slate-400 transition-colors disabled:opacity-40 cursor-pointer"
                  >
                    <FiChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default Reports;
