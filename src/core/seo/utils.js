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
import { GoogleGenAI } from '@google/genai';
export var aiTelemetryLogs = [];
export var visionMetadataCache = new Map();
export function getGeminiClient(customApiKey) {
    var key = (customApiKey && customApiKey.trim().length > 0) ? customApiKey.trim() : process.env.GEMINI_API_KEY;
    if (!key || key.trim().length === 0) {
        throw new Error('GEMINI_API_KEY is not configured or invalid.');
    }
    return new GoogleGenAI({
        apiKey: key,
        httpOptions: {
            headers: {
                'User-Agent': 'aistudio-build'
            }
        }
    });
}
export function sanitizeErrorMessage(msg) {
    var _a;
    if (!msg)
        return 'An unexpected error occurred. Please try again.';
    var str = typeof msg === 'string' ? msg : JSON.stringify(msg);
    if (str.includes('429') || str.includes('RESOURCE_EXHAUSTED') || str.includes('Quota exceeded') || str.includes('rate-limits')) {
        return 'API Quota/Rate limit reached. Please wait a moment or add a custom API key in API Keys Manager.';
    }
    if (str.includes('401') || str.includes('403') || str.includes('API_KEY_INVALID') || str.includes('invalid key') || str.includes('Unauthorized')) {
        return 'Invalid API Key. Please verify your key in API Keys Manager.';
    }
    if (str.includes('FETCH_ERROR') || str.includes('fetch failed') || str.includes('ENOTFOUND')) {
        return 'Network connection issue. Please check your internet connection and try again.';
    }
    if (str.trim().startsWith('{') || str.trim().startsWith('[')) {
        try {
            var parsed = JSON.parse(str);
            if ((_a = parsed === null || parsed === void 0 ? void 0 : parsed.error) === null || _a === void 0 ? void 0 : _a.message)
                return sanitizeErrorMessage(parsed.error.message);
        }
        catch (_b) {
            // ignore
        }
    }
    return str.length > 180 ? str.slice(0, 180) + '...' : str;
}
export function resolveBase64Image(base64Data, previewUrl, mimeType) {
    return __awaiter(this, void 0, void 0, function () {
        var resolvedBase64, resolvedMimeType, imageUrlToFetch, controller_1, timeoutId, imgRes, buffer, contentType, e_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    resolvedBase64 = base64Data;
                    resolvedMimeType = mimeType || 'image/jpeg';
                    imageUrlToFetch = (base64Data && base64Data.startsWith('http')) ? base64Data : (previewUrl && previewUrl.startsWith('http') ? previewUrl : null);
                    if (!(!resolvedBase64 && imageUrlToFetch)) return [3 /*break*/, 6];
                    _a.label = 1;
                case 1:
                    _a.trys.push([1, 5, , 6]);
                    controller_1 = new AbortController();
                    timeoutId = setTimeout(function () { return controller_1.abort(); }, 6000);
                    return [4 /*yield*/, fetch(imageUrlToFetch, { signal: controller_1.signal })];
                case 2:
                    imgRes = _a.sent();
                    clearTimeout(timeoutId);
                    if (!imgRes.ok) return [3 /*break*/, 4];
                    return [4 /*yield*/, imgRes.arrayBuffer()];
                case 3:
                    buffer = _a.sent();
                    resolvedBase64 = Buffer.from(buffer).toString('base64');
                    contentType = imgRes.headers.get('content-type');
                    if (contentType)
                        resolvedMimeType = contentType;
                    _a.label = 4;
                case 4: return [3 /*break*/, 6];
                case 5:
                    e_1 = _a.sent();
                    console.warn('Could not fetch image from URL for vision analysis:', e_1);
                    return [3 /*break*/, 6];
                case 6: return [2 /*return*/, { resolvedBase64: resolvedBase64, resolvedMimeType: resolvedMimeType }];
            }
        });
    });
}
