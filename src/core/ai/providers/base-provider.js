var BaseAiProvider = /** @class */ (function () {
    function BaseAiProvider() {
    }
    BaseAiProvider.prototype.validateModel = function (modelId) {
        return this.listModels().some(function (m) { return m.id === modelId; });
    };
    BaseAiProvider.prototype.supportsVision = function (modelId) {
        var model = this.listModels().find(function (m) { return m.id === modelId; });
        return model ? model.capabilities.vision : false;
    };
    BaseAiProvider.prototype.supportsStreaming = function (modelId) {
        var model = this.listModels().find(function (m) { return m.id === modelId; });
        return model ? model.capabilities.streaming : false;
    };
    BaseAiProvider.prototype.supportsJson = function (modelId) {
        var model = this.listModels().find(function (m) { return m.id === modelId; });
        return model ? model.capabilities.json : false;
    };
    BaseAiProvider.prototype.getCapabilities = function (modelId) {
        var model = this.listModels().find(function (m) { return m.id === modelId; });
        if (!model)
            throw new Error("Model ".concat(modelId, " not found in provider ").concat(this.id));
        return model.capabilities;
    };
    return BaseAiProvider;
}());
export { BaseAiProvider };
