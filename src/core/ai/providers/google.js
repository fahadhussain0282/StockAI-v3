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
import { GOOGLE_MODELS } from '../models/google-models';
import { GoogleGenAI } from '@google/genai';
var GoogleProvider = /** @class */ (function (_super) {
    __extends(GoogleProvider, _super);
    function GoogleProvider() {
        var _this = _super !== null && _super.apply(this, arguments) || this;
        _this.id = 'google-gemini';
        _this.name = 'Google Gemini';
        return _this;
    }
    GoogleProvider.prototype.getDefaultModel = function () {
        return 'gemini-2.5-flash';
    };
    GoogleProvider.prototype.getVisionModel = function () {
        return 'gemini-2.5-flash';
    };
    GoogleProvider.prototype.listModels = function () {
        return GOOGLE_MODELS;
    };
    GoogleProvider.prototype.generateVisionAnalysis = function (options) {
        return __awaiter(this, void 0, void 0, function () {
            var key, ai, modelToUse, start, responseText, parsed, rawStr, tokens, finishReason, config, response, cleanBase64, err_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        key = (options.customApiKey && options.customApiKey.trim().length > 0)
                            ? options.customApiKey.trim()
                            : process.env.GEMINI_API_KEY;
                        if (!key || key.trim().length === 0) {
                            throw new Error('GEMINI_API_KEY is not configured or invalid.');
                        }
                        ai = new GoogleGenAI({
                            apiKey: key,
                            httpOptions: { headers: { 'User-Agent': 'stockai-gateway' } }
                        });
                        modelToUse = options.model || this.getVisionModel();
                        if (!this.supportsVision(modelToUse) && options.base64Image) {
                            throw new Error("Model ".concat(modelToUse, " does not support vision capabilities."));
                        }
                        start = Date.now();
                        responseText = '';
                        rawStr = '';
                        tokens = { prompt: 0, completion: 0, total: 0 };
                        finishReason = 'unknown';
                        _a.label = 1;
                    case 1:
                        _a.trys.push([1, 6, , 7]);
                        config = {
                            systemInstruction: options.systemInstruction,
                            responseMimeType: 'application/json',
                        };
                        if (options.responseSchema) {
                            config.responseSchema = options.responseSchema;
                        }
                        response = void 0;
                        if (!options.base64Image) return [3 /*break*/, 3];
                        cleanBase64 = options.base64Image.replace(/^data:[^;]+;base64,/, '');
                        return [4 /*yield*/, ai.models.generateContent({
                                model: modelToUse,
                                contents: {
                                    parts: [
                                        { inlineData: { mimeType: options.mimeType || 'image/jpeg', data: cleanBase64 } },
                                        { text: options.userPrompt }
                                    ]
                                },
                                config: config
                            })];
                    case 2:
                        response = _a.sent();
                        return [3 /*break*/, 5];
                    case 3: return [4 /*yield*/, ai.models.generateContent({
                            model: modelToUse,
                            contents: options.userPrompt,
                            config: config
                        })];
                    case 4:
                        response = _a.sent();
                        _a.label = 5;
                    case 5:
                        responseText = response.text || '';
                        rawStr = JSON.stringify(response, null, 2);
                        if (response.usageMetadata) {
                            tokens = {
                                prompt: response.usageMetadata.promptTokenCount || 0,
                                completion: response.usageMetadata.candidatesTokenCount || 0,
                                total: response.usageMetadata.totalTokenCount || 0
                            };
                        }
                        if (response.candidates && response.candidates.length > 0) {
                            finishReason = response.candidates[0].finishReason || 'unknown';
                        }
                        try {
                            parsed = JSON.parse(responseText.trim() || '{}');
                        }
                        catch (e) {
                            throw new Error('Failed to parse AI response as JSON.');
                        }
                        return [3 /*break*/, 7];
                    case 6:
                        err_1 = _a.sent();
                        throw new Error("Google API Failed: ".concat(err_1.message));
                    case 7: return [2 /*return*/, {
                            success: true,
                            provider: this.id,
                            model: modelToUse,
                            latency: Date.now() - start,
                            tokens: tokens,
                            finishReason: finishReason,
                            rawResponse: rawStr,
                            parsedResponse: parsed
                        }];
                }
            });
        });
    };
    return GoogleProvider;
}(BaseAiProvider));
export { GoogleProvider };
