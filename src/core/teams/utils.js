export var generateId = function (prefix) {
    return "".concat(prefix, "_").concat(Math.random().toString(36).substring(2, 11), "_").concat(Date.now());
};
export var generateInviteToken = function () {
    return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
};
export var emitEvent = function (eventName, payload) {
    // Foundational Event Architecture for future Pub/Sub (Kafka, Redis, etc.)
    console.log("[EVENT] ".concat(eventName, ":"), payload);
};
