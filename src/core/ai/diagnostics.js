var DiagnosticsTracker = /** @class */ (function () {
    function DiagnosticsTracker() {
        this.logs = [];
    }
    DiagnosticsTracker.prototype.record = function (data) {
        this.logs.unshift(data);
        if (this.logs.length > 100) {
            this.logs.pop(); // Keep last 100
        }
        if (process.env.AI_DEVELOPER_MODE === 'true') {
            this.printDeveloperLog(data);
        }
    };
    DiagnosticsTracker.prototype.getLogs = function () {
        return this.logs;
    };
    DiagnosticsTracker.prototype.printDeveloperLog = function (data) {
        console.log('\n================================================================================');
        console.log('[AI DEVELOPER MODE - GATEWAY DIAGNOSTICS]');
        console.log("Provider: ".concat(data.providerUsed, " | Model: ").concat(data.modelUsed));
        console.log("Latency: ".concat(data.latency, "ms | Success: ").concat(data.success));
        console.log("Tokens: Prompt(".concat(data.tokenUsage.prompt, ") Completion(").concat(data.tokenUsage.completion, ")"));
        if (!data.success) {
            console.log("Error: ".concat(data.error));
        }
        console.log('================================================================================\n');
    };
    return DiagnosticsTracker;
}());
export var AiDiagnostics = new DiagnosticsTracker();
