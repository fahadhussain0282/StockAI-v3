var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
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
import { BaseAiProvider } from './base-provider';
import { XAI_MODELS } from '../models/xai-models';
var XAiProvider = /** @class */ (function (_super) {
    __extends(XAiProvider, _super);
    function XAiProvider() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = 'xai';
        _this.name = 'xAI';
        return _this;
    }
    XAiProvider.prototype.getDefaultModel = function () {
        return 'grok-2-latest';
    };
    XAiProvider.prototype.getVisionModel = function () {
        return 'grok-2-vision-latest';
    };
    XAiProvider.prototype.listModels = function () {
        return XAI_MODELS;
    };
    XAiProvider.prototype.generateVisionAnalysis = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var key, modelToUse, start, parsed, rawStr, messages, cleanBase64, mime_1, res, errStr, data, content, err_1;
            var _a, _b, _c, _d, _e, _f, _g, _h;
            return __generator(this, function (_j) {
                switch (_j.label) {
                    case 0:
                        key = (options.customApiKey && options.customApiKey.trim().length > 0)
                            ? options.customApiKey.trim()
                            : process.env.XAI_API_KEY;
                        if (!key || key.trim().length === 0) {
                            throw new Error('XAI_API_KEY is not configured or invalid.');
                        }
                        modelToUse = options.model || this.getVisionModel();
                        if (!this.supportsVision(modelToUse) && options.base64Image) {
                            throw new Error("Model ".concat(modelToUse, " does not support vision capabilities."));
                        }
                        start = Date.now();
                        rawStr = '';
                        _j.label = 1;
                    case 1:
                        _j.trys.push([1, 6, , 7]);
                        messages = [
                            { role: 'system', content: options.systemInstruction }
                        ];
                        if (options.base64Image) {
                            cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
                            mime_1 = options.mimeType || 'image/jpeg';
                            messages.push({
                                role: 'user',
                                content: [
                                    { type: 'text', text: options.userPrompt },
                                    { type: 'image_url', image_url: { url: "data:".concat(mime_1, ";base64,").concat(cleanBase64) } }
                                ]
                            });
                        }
                        else {
                            messages.push({ role: 'user', content: options.userPrompt });
                        }
                        return [4 /*yield*/, fetch('https://api.x.ai/v1/chat/completions', {
                                method: 'POST',
                                headers: {
                                    'Authorization': "Bearer ".concat(key),
                                    'Content-Type': 'application/json'
                                },
                                body: JSON.stringify({
                                    model: modelToUse,
                                    messages: messages,
                                    response_format: { type: 'json_object' }
                                })
                            })];
                    case 2:
                        res = _j.sent();
                        if (!!res.ok) return [3 /*break*/, 4];
                        return [4 /*yield*/, res.text()];
                    case 3:
                        errStr = _j.sent();
                        throw new Error("xAI API Error: ".concat(res.status, " ").concat(errStr));
                    case 4: return [4 /*yield*/, res.json()];
                    case 5:
                        data = _j.sent();
                        rawStr = JSON.stringify(data, null, 2);
                        content = ((_c = (_b = (_a = data.choices) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.message) === null || _c === void 0 ? void 0 : _c.content) || '{}';
                        try {
                            parsed = JSON.parse(content);
                        }
                        catch (e) {
                            throw new Error('Failed to parse AI response as JSON.');
                        }
                        return [2 /*return*/, {
                                success: true,
                                provider: this.id,
                                model: modelToUse,
                                latency: Date.now() - start,
                                tokens: {
                                    prompt: ((_d = data.usage) === null || _d === void 0 ? void 0 : _d.prompt_tokens) || 0,
                                    completion: ((_e = data.usage) === null || _e === void 0 ? void 0 : _e.completion_tokens) || 0,
                                    total: ((_f = data.usage) === null || _f === void 0 ? void 0 : _f.total_tokens) || 0
                                },
                                finishReason: ((_h = (_g = data.choices) === null || _g === void 0 ? void 0 : _g[0]) === null || _h === void 0 ? void 0 : _h.finish_reason) || 'unknown',
                                rawResponse: rawStr,
                                parsedResponse: parsed
                            }];
                    case 6:
                        err_1 = _j.sent();
                        throw new Error("xAI API Failed: ".concat(err_1.message));
                    case 7: return [2 /*return*/];
                }
            });
        });
    };
    return XAiProvider;
}(BaseAiProvider));
export { XAiProvider };
