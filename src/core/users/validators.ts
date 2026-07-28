import { USER_CONSTANTS } from './constants';
import { validateEmailFormat } from './utils';

export const validateProfileUpdate = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.username !== undefined) {
    if (typeof data.username !== 'string' || data.username.length < USER_CONSTANTS.USERNAME_MIN_LENGTH || data.username.length > USER_CONSTANTS.USERNAME_MAX_LENGTH) {
      errors.push(`Username must be between ${USER_CONSTANTS.USERNAME_MIN_LENGTH} and ${USER_CONSTANTS.USERNAME_MAX_LENGTH} characters.`);
    }
    if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
      errors.push('Username can only contain alphanumeric characters and underscores.');
    }
  }

  if (data.bio !== undefined && typeof data.bio === 'string' && data.bio.length > USER_CONSTANTS.BIO_MAX_LENGTH) {
    errors.push(`Bio must be less than ${USER_CONSTANTS.BIO_MAX_LENGTH} characters.`);
  }

  if (data.website !== undefined && typeof data.website === 'string' && data.website.length > 0) {
    try {
      new URL(data.website);
    } catch {
      errors.push('Website must be a valid URL.');
    }
  }

  return { valid: errors.length === 0, errors };
};

export const validatePreferencesUpdate = (data: any): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];

  if (data.theme !== undefined && !['light', 'dark', 'system'].includes(data.theme)) {
    errors.push('Invalid theme selection.');
  }

  return { valid: errors.length === 0, errors };
};

export const validateEmailChange = (email: string): boolean => {
  return validateEmailFormat(email);
};

export const validatePasswordChange = (password: string): boolean => {
  return typeof password === 'string' && password.length >= USER_CONSTANTS.PASSWORD_MIN_LENGTH;
};
