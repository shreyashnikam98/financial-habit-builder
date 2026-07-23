import React, { lazy, Suspense } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';

import AuthLayout from './layouts/AuthLayout';
import MainLayout from './layouts/MainLayout';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import { SkeletonPage } from './components/SkeletonLoader';

// Code Splitting & Lazy Loaded Route Components
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Habits = lazy(() => import('./pages/Habits'));
const Incomes = lazy(() => import('./pages/Incomes'));
const Expenses = lazy(() => import('./pages/Expenses'));
const Transactions = lazy(() => import('./pages/Transactions'));
const Goals = lazy(() => import('./pages/Goals'));
const Investments = lazy(() => import('./pages/Investments'));
const Budgets = lazy(() => import('./pages/Budgets'));
const Profile = lazy(() => import('./pages/Profile'));
const Reports = lazy(() => import('./pages/Reports'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Forbidden = lazy(() => import('./pages/Forbidden'));
const ErrorPage = lazy(() => import('./pages/ErrorPage'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ErrorBoundary>
          <Router>
            <ToastContainer position="top-right" autoClose={3000} theme="dark" />
            <Suspense
              fallback={
                <div className="p-6 min-h-screen bg-slate-50 dark:bg-slate-950">
                  <SkeletonPage />
                </div>
              }
            >
              <Routes>
                {/* Public Auth Routes */}
                <Route element={<AuthLayout />}>
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                </Route>

                {/* Protected Application Routes */}
                <Route element={<ProtectedRoute />}>
                  <Route element={<MainLayout />}>
                    <Route path="/dashboard" element={<Dashboard />} />
                    <Route path="/habits" element={<Habits />} />
                    <Route path="/incomes" element={<Incomes />} />
                    <Route path="/expenses" element={<Expenses />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/goals" element={<Goals />} />
                    <Route path="/investments" element={<Investments />} />
                    <Route path="/budgets" element={<Budgets />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/reports" element={<Reports />} />
                  </Route>
                </Route>

                {/* Error & Special System Routes */}
                <Route path="/forbidden" element={<Forbidden />} />
                <Route path="/error" element={<ErrorPage />} />

                {/* Default redirects */}
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </ErrorBoundary>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
