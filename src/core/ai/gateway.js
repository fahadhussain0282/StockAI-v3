var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
import { AiRegistry } from './registry';
import { AiHealth } from './health';
import { AiDiagnostics } from './diagnostics';
var Gateway = /** @class */ (function () {
    function Gateway() {
    }
    Gateway.prototype.generateVisionAnalysis = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var requestStart, providerImpl, modelToUse, success, response, errorMsg, err_1, requestEnd, payloadSize;
            var _a, _b, _c, _d, _e;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        requestStart = Date.now();
                        providerImpl = AiRegistry.getProvider(options.provider);
                        modelToUse = options.model || providerImpl.getVisionModel();
                        // 1. Validate Provider & Model
                        if (!providerImpl.validateModel(modelToUse)) {
                            throw new Error("Model ".concat(modelToUse, " is not valid for provider ").concat(options.provider, "."));
                        }
                        // 2. Validate Capabilities
                        if (options.base64Image && !providerImpl.supportsVision(modelToUse)) {
                            throw new Error("Model ".concat(modelToUse, " does not support vision capabilities."));
                        }
                        success = false;
                        response = null;
                        errorMsg = '';
                        _f.label = 1;
                    case 1:
                        _f.trys.push([1, 3, 4, 5]);
                        return [4 /*yield*/, providerImpl.generateVisionAnalysis(__assign(__assign({}, options), { model: modelToUse }))];
                    case 2:
                        response = _f.sent();
                        success = true;
                        AiHealth.recordSuccess(options.provider, response.latency);
                        return [2 /*return*/, response];
                    case 3:
                        err_1 = _f.sent();
                        success = false;
                        errorMsg = err_1.message || 'Unknown error';
                        AiHealth.recordFailure(options.provider);
                        throw new Error("Gateway Error: ".concat(errorMsg));
                    case 4:
                        requestEnd = Date.now();
                        payloadSize = (((_a = options.base64Image) === null || _a === void 0 ? void 0 : _a.length) || 0) + (((_b = options.userPrompt) === null || _b === void 0 ? void 0 : _b.length) || 0);
                        AiDiagnostics.record({
                            requestStart: requestStart,
                            requestEnd: requestEnd,
                            latency: requestEnd - requestStart,
                            payloadSize: payloadSize,
                            imageSize: ((_c = options.base64Image) === null || _c === void 0 ? void 0 : _c.length) || 0,
                            promptSize: ((_d = options.userPrompt) === null || _d === void 0 ? void 0 : _d.length) || 0,
                            modelUsed: modelToUse,
                            providerUsed: options.provider,
                            responseSize: ((_e = response === null || response === void 0 ? void 0 : response.rawResponse) === null || _e === void 0 ? void 0 : _e.length) || 0,
                            tokenUsage: (response === null || response === void 0 ? void 0 : response.tokens) || { prompt: 0, completion: 0, total: 0 },
                            finishReason: (response === null || response === void 0 ? void 0 : response.finishReason) || 'error',
                            success: success,
                            error: success ? undefined : errorMsg
                        });
                        return [7 /*endfinally*/];
                    case 5: return [2 /*return*/];
                }
            });
        });
    };
    Gateway.prototype.getHealth = function () {
        return AiHealth.getAllStats();
    };
    Gateway.prototype.getDiagnostics = function () {
        return AiDiagnostics.getLogs();
    };
    return Gateway;
}());
export { Gateway };
export var AiGateway = new Gateway();
