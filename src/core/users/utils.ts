export const generateId = (prefix: string = 'id') => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
};

export const validateEmailFormat = (email: string): boolean => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email);
};

export const sanitizeString = (str: string): string => {
  return str.replace(/[<>]/g, '').trim();
};
