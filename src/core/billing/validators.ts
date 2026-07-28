export const validateAmount = (amount: number): boolean => {
  return typeof amount === 'number' && amount > 0 && Number.isInteger(amount);
};

export const validateCurrency = (currency: string): boolean => {
  return typeof currency === 'string' && currency.length === 3;
};
