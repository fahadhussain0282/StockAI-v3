var HealthTracker = /** @class */ (function () {
    function HealthTracker() {
        this.stats = new Map();
    }
    HealthTracker.prototype.recordSuccess = function (providerId, latency) {
        var current = this.getStats(providerId);
        current.status = 'online';
        current.latency = latency;
        current.lastSuccess = new Date().toISOString();
        current.successRate = ((current.successRate * current.failureCount) + 100) / (current.failureCount + 1); // Simple running avg
        this.stats.set(providerId, current);
    };
    HealthTracker.prototype.recordFailure = function (providerId) {
        var current = this.getStats(providerId);
        current.status = current.failureCount > 3 ? 'offline' : 'degraded';
        current.lastFailure = new Date().toISOString();
        current.failureCount++;
        current.successRate = ((current.successRate * (current.failureCount - 1))) / current.failureCount;
        this.stats.set(providerId, current);
    };
    HealthTracker.prototype.getStats = function (providerId) {
        if (!this.stats.has(providerId)) {
            this.stats.set(providerId, {
                status: 'online',
                latency: 0,
                lastSuccess: null,
                lastFailure: null,
                failureCount: 0,
                successRate: 100
            });
        }
        return this.stats.get(providerId);
    };
    HealthTracker.prototype.getAllStats = function () {
        var result = {};
        for (var _i = 0, _a = this.stats.entries(); _i < _a.length; _i++) {
            var _b = _a[_i], key = _b[0], val = _b[1];
            result[key] = val;
        }
        return result;
    };
    return HealthTracker;
}());
export var AiHealth = new HealthTracker();
