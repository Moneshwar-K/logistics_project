/**
 * Comprehensive validation utilities for the logistics platform
 * All validators return an object with { valid: boolean, error?: string }
 */

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate email address
 */
export function validateEmail(email: string): ValidationResult {
  if (!email || !email.trim()) {
    return { valid: false, error: 'Email is required' };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return { valid: false, error: 'Please enter a valid email address' };
  }

  return { valid: true };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  if (!password) {
    return { valid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, error: 'Password must contain at least one number' };
  }

  return { valid: true };
}

/**
 * Validate phone number
 */
export function validatePhoneNumber(phone: string): ValidationResult {
  if (!phone || !phone.trim()) {
    return { valid: false, error: 'Phone number is required' };
  }

  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  if (!phoneRegex.test(phone)) {
    return { valid: false, error: 'Phone number contains invalid characters' };
  }

  const digitsOnly = phone.replace(/\D/g, '');
  if (digitsOnly.length < 10) {
    return { valid: false, error: 'Phone number must have at least 10 digits' };
  }

  return { valid: true };
}

/**
 * Validate GSTIN (Goods and Services Tax Identification Number)
 */
export function validateGSTIN(gstin: string): ValidationResult {
  if (!gstin || !gstin.trim()) {
    return { valid: false, error: 'GSTIN is required' };
  }

  const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
  if (!gstinRegex.test(gstin.toUpperCase())) {
    return { valid: false, error: 'Please enter a valid GSTIN (15 characters)' };
  }

  return { valid: true };
}

/**
 * Validate HAWB (House Airway Bill)
 */
export function validateHAWB(hawb: string): ValidationResult {
  if (!hawb || !hawb.trim()) {
    return { valid: false, error: 'HAWB is required' };
  }

  const hawbRegex = /^[A-Z0-9]{3,20}$/;
  if (!hawbRegex.test(hawb.toUpperCase())) {
    return { valid: false, error: 'HAWB must be 3-20 alphanumeric characters' };
  }

  return { valid: true };
}

/**
 * Validate name (shipper, consignee, etc.)
 */
export function validateName(name: string): ValidationResult {
  if (!name || !name.trim()) {
    return { valid: false, error: 'Name is required' };
  }

  if (name.length < 3) {
    return { valid: false, error: 'Name must be at least 3 characters' };
  }

  if (name.length > 100) {
    return { valid: false, error: 'Name must not exceed 100 characters' };
  }

  return { valid: true };
}

/**
 * Validate address
 */
export function validateAddress(address: string): ValidationResult {
  if (!address || !address.trim()) {
    return { valid: false, error: 'Address is required' };
  }

  if (address.length < 5) {
    return { valid: false, error: 'Address must be at least 5 characters' };
  }

  return { valid: true };
}

/**
 * Validate postal code
 */
export function validatePostalCode(postalCode: string): ValidationResult {
  if (!postalCode || !postalCode.trim()) {
    return { valid: false, error: 'Postal code is required' };
  }

  const postalRegex = /^[A-Z0-9\s\-]{3,20}$/;
  if (!postalRegex.test(postalCode.toUpperCase())) {
    return { valid: false, error: 'Please enter a valid postal code' };
  }

  return { valid: true };
}

/**
 * Validate weight (must be positive number)
 */
export function validateWeight(weight: number | string): ValidationResult {
  const num = typeof weight === 'string' ? parseFloat(weight) : weight;

  if (isNaN(num)) {
    return { valid: false, error: 'Weight must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Weight must be greater than 0' };
  }

  if (num > 1000000) {
    return { valid: false, error: 'Weight exceeds maximum limit' };
  }

  return { valid: true };
}

/**
 * Validate number of cartons
 */
export function validateCartons(cartons: number | string): ValidationResult {
  const num = typeof cartons === 'string' ? parseInt(cartons, 10) : cartons;

  if (isNaN(num)) {
    return { valid: false, error: 'Number of cartons must be a valid number' };
  }

  if (num <= 0) {
    return { valid: false, error: 'Number of cartons must be greater than 0' };
  }

  if (num > 10000) {
    return { valid: false, error: 'Number of cartons exceeds maximum limit' };
  }

  return { valid: true };
}

/**
 * Validate invoice amount
 */
export function validateAmount(amount: number | string): ValidationResult {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(num)) {
    return { valid: false, error: 'Amount must be a valid number' };
  }

  if (num < 0) {
    return { valid: false, error: 'Amount cannot be negative' };
  }

  return { valid: true };
}

/**
 * Validate date (must not be in past)
 */
export function validateFutureDate(date: string | Date): ValidationResult {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  if (d < now) {
    return { valid: false, error: 'Date must be in the future' };
  }

  return { valid: true };
}

/**
 * Validate date (must not be in future)
 */
export function validatePastDate(date: string | Date): ValidationResult {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();

  if (d > now) {
    return { valid: false, error: 'Date must be in the past' };
  }

  return { valid: true };
}

/**
 * Validate date range
 */
export function validateDateRange(startDate: string | Date, endDate: string | Date): ValidationResult {
  const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const end = typeof endDate === 'string' ? new Date(endDate) : endDate;

  if (start > end) {
    return { valid: false, error: 'Start date must be before end date' };
  }

  return { valid: true };
}

/**
 * Validate required field
 */
export function validateRequired(value: any): ValidationResult {
  if (value === null || value === undefined || value === '') {
    return { valid: false, error: 'This field is required' };
  }

  return { valid: true };
}

/**
 * Validate form object (multiple fields)
 */
export interface FormValidationRules {
  [key: string]: (value: any) => ValidationResult;
}

export function validateForm(formData: Record<string, any>, rules: FormValidationRules): Record<string, string> {
  const errors: Record<string, string> = {};

  for (const [field, rule] of Object.entries(rules)) {
    const result = rule(formData[field]);
    if (!result.valid && result.error) {
      errors[field] = result.error;
    }
  }

  return errors;
}

/**
 * Check if form has errors
 */
export function hasFormErrors(errors: Record<string, string>): boolean {
  return Object.keys(errors).length > 0;
}

/**
 * Validate JSON string
 */
export function validateJSON(jsonString: string): ValidationResult {
  try {
    JSON.parse(jsonString);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

/**
 * Validate URL
 */
export function validateURL(url: string): ValidationResult {
  try {
    new URL(url);
    return { valid: true };
  } catch (error) {
    return { valid: false, error: 'Please enter a valid URL' };
  }
}

/**
 * Validate file size (in bytes)
 */
export function validateFileSize(size: number, maxSizeMB: number = 10): ValidationResult {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;

  if (size > maxSizeBytes) {
    return { valid: false, error: `File size must not exceed ${maxSizeMB}MB` };
  }

  return { valid: true };
}

/**
 * Validate file type
 */
export function validateFileType(fileName: string, allowedTypes: string[]): ValidationResult {
  const fileExtension = fileName.split('.').pop()?.toLowerCase();

  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return { valid: false, error: `Only ${allowedTypes.join(', ')} files are allowed` };
  }

  return { valid: true };
}
