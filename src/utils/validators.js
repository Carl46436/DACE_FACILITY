// ============================================================
// Validators
// Client-side form validation utilities
// ============================================================

export const validators = {
  email: (email) => {
    const regex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!email) return 'Email is required.';
    if (!regex.test(email)) return 'Please provide a valid email.';
    return null;
  },

  password: (password) => {
    if (!password) return 'Password is required.';
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Password must contain an uppercase letter.';
    if (!/[a-z]/.test(password)) return 'Password must contain a lowercase letter.';
    if (!/[0-9]/.test(password)) return 'Password must contain a number.';
    if (!/[^A-Za-z0-9]/.test(password)) return 'Password must contain a special character.';
    return null;
  },

  fullName: (name) => {
    if (!name) return 'Full name is required.';
    if (name.length < 2) return 'Full name must be at least 2 characters.';
    if (name.length > 255) return 'Full name must be under 255 characters.';
    if (!/^[a-zA-Z\s'-]+$/.test(name)) return 'Name can only contain letters, spaces, hyphens, and apostrophes.';
    return null;
  },

  phone: (phone) => {
    if (!phone) return null; // Optional
    const regex = /^\+?[0-9]{7,15}$/;
    if (!regex.test(phone)) return 'Please provide a valid phone number.';
    return null;
  },

  required: (value, fieldName = 'This field') => {
    if (!value || (typeof value === 'string' && !value.trim())) {
      return `${fieldName} is required.`;
    }
    return null;
  },

  minLength: (value, min, fieldName = 'This field') => {
    if (value && value.length < min) {
      return `${fieldName} must be at least ${min} characters.`;
    }
    return null;
  },

  maxLength: (value, max, fieldName = 'This field') => {
    if (value && value.length > max) {
      return `${fieldName} must be under ${max} characters.`;
    }
    return null;
  },

  futureDate: (dateStr) => {
    if (!dateStr) return 'Date is required.';
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return 'Invalid date.';
    if (date <= new Date()) return 'Date must be in the future.';
    return null;
  },
};

export default validators;
