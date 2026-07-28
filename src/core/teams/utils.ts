export const generateId = (prefix: string): string => {
  return `${prefix}_${Math.random().toString(36).substring(2, 11)}_${Date.now()}`;
};

export const generateInviteToken = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};

export const emitEvent = (eventName: string, payload: any) => {
  // Foundational Event Architecture for future Pub/Sub (Kafka, Redis, etc.)
  console.log(`[EVENT] ${eventName}:`, payload);
};
