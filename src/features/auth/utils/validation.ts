const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): string | null {
  const value = email.trim().toLowerCase();
  if (!value) return 'Email is required';
  if (!EMAIL_REGEX.test(value)) return 'Email must be a valid email';
  return null;
}

export function validatePassword(password: string, { minLength = 1 } = {}): string | null {
  if (!password) return 'Password is required';
  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }
  return null;
}

export function validateDisplayName(displayName: string): string | null {
  const value = displayName.trim();
  if (!value) return 'Display name is required';
  if (value.length < 4) return 'Display name must be at least 4 characters';
  return null;
}
