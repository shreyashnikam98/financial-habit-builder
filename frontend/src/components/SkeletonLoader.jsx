import React from 'react';

// Single Stat Card Skeleton
export const SkeletonCard = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs animate-pulse space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-full w-24" />
            <div className="h-9 w-9 bg-slate-200 dark:bg-slate-800 rounded-xl" />
          </div>
          <div className="h-7 bg-slate-300 dark:bg-slate-700 rounded-lg w-36" />
          <div className="h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full w-48" />
        </div>
      ))}
    </>
  );
};

// Table Grid Skeleton
export const SkeletonTable = ({ rows = 5 }) => {
  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-5 shadow-xs animate-pulse space-y-4">
      <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-40" />
      <div className="space-y-3 pt-2">
        <div className="h-8 bg-slate-100 dark:bg-slate-800/80 rounded-xl w-full" />
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800/60">
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/4" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/5" />
            <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-md w-1/6" />
            <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-12" />
          </div>
        ))}
      </div>
    </div>
  );
};

// Chart Container Skeleton
export const SkeletonChart = ({ height = 'h-72' }) => {
  return (
    <div className={`bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-xs animate-pulse space-y-4 ${height}`}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-4 bg-slate-300 dark:bg-slate-700 rounded-md w-48" />
          <div className="h-3 bg-slate-200 dark:bg-slate-800 rounded-md w-64" />
        </div>
        <div className="h-8 bg-slate-200 dark:bg-slate-800 rounded-xl w-24" />
      </div>
      <div className="h-4/5 bg-slate-100 dark:bg-slate-800/40 rounded-2xl w-full flex items-end justify-between p-4 gap-2">
        <div className="bg-slate-200 dark:bg-slate-800 rounded-t-lg w-1/6 h-1/3" />
        <div className="bg-slate-300 dark:bg-slate-700 rounded-t-lg w-1/6 h-2/3" />
        <div className="bg-slate-200 dark:bg-slate-800 rounded-t-lg w-1/6 h-1/2" />
        <div className="bg-slate-300 dark:bg-slate-700 rounded-t-lg w-1/6 h-4/5" />
        <div className="bg-slate-200 dark:bg-slate-800 rounded-t-lg w-1/6 h-3/5" />
      </div>
    </div>
  );
};

// Full Page Placeholder Skeleton for Suspense Fallbacks
export const SkeletonPage = () => {
  return (
    <div className="space-y-6 pb-8 animate-pulse">
      {/* Header skeleton */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-2">
          <div className="h-7 bg-slate-300 dark:bg-slate-700 rounded-xl w-56" />
          <div className="h-3.5 bg-slate-200 dark:bg-slate-800 rounded-lg w-72" />
        </div>
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded-xl w-32" />
      </div>

      {/* Grid of cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SkeletonCard count={4} />
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SkeletonChart height="h-80" />
        <SkeletonChart height="h-80" />
      </div>
    </div>
  );
};

export default SkeletonPage;
