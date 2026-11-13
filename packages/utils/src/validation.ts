/**
 * Strict Authentication & Credential Validation Rules for MinesQuiz
 */

export interface LegalNameValidation {
  isValid: boolean;
  error?: string;
  formattedName: string;
}

export interface PasswordCriteria {
  hasMinLength: boolean;
  hasUpperAndLower: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  doesNotContainIdentity: boolean;
  isNotCommon: boolean;
  isValid: boolean;
  error?: string;
}

export interface PasswordStrength {
  score: number; // 0 - 100
  label: 'Weak' | 'Fair' | 'Good' | 'Strong';
  color: string;
  bgColor: string;
}

const COMMON_PASSWORDS = new Set([
  'password',
  'password123',
  '12345678',
  '123456789',
  '1234567890',
  'qwerty123',
  'admin123',
  'minesquiz',
  'welcome123',
  'iloveyou',
]);

const BLACKLISTED_NAMES = new Set([
  'test',
  'tester',
  'test user',
  'asdf',
  'qwerty',
  'fake user',
  'admin',
  'administrator',
  'dummy',
  'anonymous',
  'unknown',
]);

/**
 * Validates legal candidate / administrator name
 */
export function validateLegalName(
  rawName: string,
  role: 'student' | 'admin' = 'student'
): LegalNameValidation {
  const cleaned = rawName.trim().replace(/\s+/g, ' ');

  if (!cleaned) {
    return {
      isValid: false,
      error: 'Please enter your full legal name.',
      formattedName: '',
    };
  }

  if (cleaned.length < 3) {
    return {
      isValid: false,
      error: 'Name must be at least 3 characters long.',
      formattedName: cleaned,
    };
  }

  if (cleaned.length > 60) {
    return {
      isValid: false,
      error: 'Name cannot exceed 60 characters.',
      formattedName: cleaned,
    };
  }

  // Only letters, spaces, and single dots are allowed
  const legalCharRegex = /^[A-Za-z. ]+$/;
  if (!legalCharRegex.test(cleaned)) {
    return {
      isValid: false,
      error: 'Name can only contain alphabets and dots. Digits or symbols are not allowed.',
      formattedName: cleaned,
    };
  }

  // Check blacklisted dummy names
  if (BLACKLISTED_NAMES.has(cleaned.toLowerCase())) {
    return {
      isValid: false,
      error: 'Please enter a genuine legal candidate name.',
      formattedName: cleaned,
    };
  }

  // Check word count (First Name + Last Name)
  const words = cleaned.split(' ').filter((w) => w.length > 0);
  if (role === 'student' && words.length < 2) {
    return {
      isValid: false,
      error: 'Please provide both First Name and Last Name (e.g. Ananya Sharma).',
      formattedName: cleaned,
    };
  }

  // Format to Title Case
  const formattedName = words
    .map((w) => {
      if (w.includes('.')) {
        return w.toUpperCase();
      }
      return w.charAt(0).toUpperCase() + w.slice(1).toLowerCase();
    })
    .join(' ');

  return {
    isValid: true,
    formattedName,
  };
}

/**
 * Strict Enterprise Password Validation
 */
export function validatePasswordStrict(
  password: string,
  options: {
    role?: 'student' | 'admin';
    name?: string;
    email?: string;
  } = {}
): PasswordCriteria {
  const role = options.role || 'student';
  const minLength = role === 'admin' ? 10 : 8;

  const hasMinLength = password.length >= minLength;
  const hasUpperAndLower = /[A-Z]/.test(password) && /[a-z]/.test(password);
  const numberCount = (password.match(/\d/g) || []).length;
  const hasNumber = role === 'admin' ? numberCount >= 2 : numberCount >= 1;
  const hasSpecial = /[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/]/.test(password);

  // Check if password contains name or email prefix
  let doesNotContainIdentity = true;
  if (options.name && options.name.trim().length >= 3) {
    const firstWord = options.name.trim().split(' ')[0].toLowerCase();
    if (firstWord.length >= 3 && password.toLowerCase().includes(firstWord)) {
      doesNotContainIdentity = false;
    }
  }
  if (options.email && options.email.includes('@')) {
    const emailPrefix = options.email.split('@')[0].toLowerCase();
    if (emailPrefix.length >= 3 && password.toLowerCase().includes(emailPrefix)) {
      doesNotContainIdentity = false;
    }
  }

  // Check common passwords
  const isNotCommon = !COMMON_PASSWORDS.has(password.toLowerCase());

  let error: string | undefined;
  if (!hasMinLength) {
    error = `Password must be at least ${minLength} characters long for ${role}s.`;
  } else if (!hasUpperAndLower) {
    error = 'Password must include both uppercase (A-Z) and lowercase (a-z) letters.';
  } else if (!hasNumber) {
    error = role === 'admin' ? 'Admin passwords require at least 2 numbers.' : 'Password must contain at least 1 number.';
  } else if (!hasSpecial) {
    error = 'Password must contain at least 1 special character (@, #, $, etc.).';
  } else if (!doesNotContainIdentity) {
    error = 'Password cannot contain your name or email address.';
  } else if (!isNotCommon) {
    error = 'This password is too common. Please choose a more secure password.';
  }

  const isValid =
    hasMinLength &&
    hasUpperAndLower &&
    hasNumber &&
    hasSpecial &&
    doesNotContainIdentity &&
    isNotCommon;

  return {
    hasMinLength,
    hasUpperAndLower,
    hasNumber,
    hasSpecial,
    doesNotContainIdentity,
    isNotCommon,
    isValid,
    error,
  };
}

/**
 * Calculates visual strength score and color for progress indicators
 */
export function calculatePasswordStrength(
  password: string,
  role: 'student' | 'admin' = 'student'
): PasswordStrength {
  if (!password) {
    return {
      score: 0,
      label: 'Weak',
      color: 'text-slate-400',
      bgColor: 'bg-slate-200 dark:bg-slate-700',
    };
  }

  let points = 0;
  const minLength = role === 'admin' ? 10 : 8;

  if (password.length >= minLength) points += 25;
  if (password.length >= minLength + 4) points += 10;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 25;
  if (/\d/.test(password)) points += 20;
  if (/[!@#$%^&*()_+\-=[\]{}|;:,.<>?~`\\/]/.test(password)) points += 20;

  const score = Math.min(100, points);

  if (score < 40) {
    return {
      score,
      label: 'Weak',
      color: 'text-red-500',
      bgColor: 'bg-red-500',
    };
  }
  if (score < 70) {
    return {
      score,
      label: 'Fair',
      color: 'text-amber-500',
      bgColor: 'bg-amber-500',
    };
  }
  if (score < 90) {
    return {
      score,
      label: 'Good',
      color: 'text-blue-500',
      bgColor: 'bg-blue-500',
    };
  }
  return {
    score: 100,
    label: 'Strong',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500',
  };
}
