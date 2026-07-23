/**
 * Utility validation functions for form inputs
 */

// Validate email format
export const validateEmail = (email) => {
  if (!email || !email.trim()) return 'Email address is required';
  const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  if (!re.test(email.trim())) return 'Please enter a valid email address';
  return null;
};

// Validate password strength
export const validatePassword = (password) => {
  if (!password) return 'Password is required';
  if (password.length < 6) return 'Password must be at least 6 characters long';
  return null;
};

// Validate monetary amount
export const validateAmount = (amount, fieldName = 'Amount') => {
  if (amount === undefined || amount === null || amount === '') {
    return `${fieldName} is required`;
  }
  const num = Number(amount);
  if (isNaN(num)) return `${fieldName} must be a valid number`;
  if (num < 0) return `${fieldName} cannot be negative`;
  return null;
};

// Validate required text field
export const validateRequired = (val, fieldName = 'Field') => {
  if (!val || !val.toString().trim()) {
    return `${fieldName} is required`;
  }
  return null;
};

// Validate date
export const validateDate = (dateVal, fieldName = 'Date') => {
  if (!dateVal) return `${fieldName} is required`;
  const d = new Date(dateVal);
  if (isNaN(d.getTime())) return `Please enter a valid date for ${fieldName}`;
  return null;
};
