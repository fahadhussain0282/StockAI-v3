export const generateId = (prefix: string): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
};

export const emitBillingEvent = (eventName: string, payload: any) => {
  // Foundational Event Architecture for future Pub/Sub
  console.log(`[BILLING_EVENT] ${eventName}:`, payload);
};

export const calculateProration = (currentPrice: number, newPrice: number, daysRemaining: number, totalDays: number): number => {
  // Simplified proration logic
  const dailyRateDiff = (newPrice - currentPrice) / totalDays;
  return Math.max(0, Math.round(dailyRateDiff * daysRemaining));
};
