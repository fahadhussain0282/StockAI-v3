import { TEAMS_CONSTANTS } from './constants';

export const validateName = (name: string): boolean => {
  return typeof name === 'string' && name.length >= TEAMS_CONSTANTS.NAME_MIN_LENGTH && name.length <= TEAMS_CONSTANTS.NAME_MAX_LENGTH;
};

export const validateEmail = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const validateRole = (role: string): boolean => {
  const validRoles = ['OWNER', 'ADMIN', 'MANAGER', 'CONTRIBUTOR', 'VIEWER', 'GUEST'];
  return validRoles.includes(role);
};
