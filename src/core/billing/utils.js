export var generateId = function (prefix) {
    return "".concat(prefix, "_").concat(Math.random().toString(36).substring(2, 11), "_").concat(Date.now());
};
export var emitBillingEvent = function (eventName, payload) {
    // Foundational Event Architecture for future Pub/Sub
    console.log("[BILLING_EVENT] ".concat(eventName, ":"), payload);
};
export var calculateProration = function (currentPrice, newPrice, daysRemaining, totalDays) {
    // Simplified proration logic
    var dailyRateDiff = (newPrice - currentPrice) / totalDays;
    return Math.max(0, Math.round(dailyRateDiff * daysRemaining));
};
