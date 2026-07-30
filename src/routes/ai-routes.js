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
import { Router } from 'express';
import { SeoEngine, sanitizeErrorMessage, getGeminiClient, aiTelemetryLogs } from '../core/seo';
import { MARKETPLACE_REGISTRY } from '../registries/marketplaces';
import { AuthMiddleware } from '../core/auth';
import { syncUserLicense } from '../core/admin/admin-store';
var router = Router();
// ─── Helper: Strict Auth + Subscription Check ─────────────────────────────────
function validateAuthAndSubscription(req, res) {
    return __awaiter(this, void 0, void 0, function () {
        var authHeader, deviceHeader, token, SessionService, auth, user;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    authHeader = req.headers['authorization'];
                    deviceHeader = req.headers['x-device-id'] || '';
                    if (!authHeader || !authHeader.startsWith('Bearer ')) {
                        res.status(401).json({
                            error: 'Authentication required. Please sign in to use StockAI.',
                            code: 'AUTH_REQUIRED'
                        });
                        return [2 /*return*/, null];
                    }
                    token = authHeader.substring(7);
                    return [4 /*yield*/, import('../core/auth')];
                case 1:
                    SessionService = (_a.sent()).SessionService;
                    return [4 /*yield*/, SessionService.validateSession(token, deviceHeader)];
                case 2:
                    auth = _a.sent();
                    if (!auth) {
                        res.status(401).json({
                            error: 'Your session has expired. Please sign in again.',
                            code: 'SESSION_EXPIRED'
                        });
                        return [2 /*return*/, null];
                    }
                    // Admins bypass subscription checks
                    if (auth.user.role === 'admin') {
                        return [2 /*return*/, { userId: auth.user.id, isAdmin: true }];
                    }
                    return [4 /*yield*/, syncUserLicense(auth.user.id)];
                case 3:
                    user = _a.sent();
                    if (!user || !user.subscription.isActive || user.subscription.isExpired || user.status === 'expired' || user.status === 'suspended') {
                        res.status(403).json({
                            error: 'Subscription Required. Your StockAI license is not active. Please activate a plan to continue.',
                            code: 'SUBSCRIPTION_REQUIRED',
                            status: (user === null || user === void 0 ? void 0 : user.status) || 'inactive'
                        });
                        return [2 /*return*/, null];
                    }
                    return [2 /*return*/, { userId: auth.user.id, isAdmin: false }];
            }
        });
    });
}
// ─── Test API Key ─────────────────────────────────────────────────────────────
router.post('/test-key', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, provider, apiKey, model, keyToUse, testRes, netErr_1, errBody, _b, keyToUse, testRes, netErr_2, ai, testResponse, geminiErr_1, err_1;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 19, , 20]);
                _a = req.body, provider = _a.provider, apiKey = _a.apiKey, model = _a.model;
                if (!provider) {
                    return [2 /*return*/, res.status(400).json({ status: 'error', message: 'Provider is required.' })];
                }
                if (!(provider === 'grok')) return [3 /*break*/, 9];
                keyToUse = apiKey || process.env.GROK_API_KEY;
                if (!keyToUse) {
                    return [2 /*return*/, res.status(400).json({ status: 'error', message: 'No Grok (xAI) API Key provided. Please enter your xAI API key.' })];
                }
                testRes = void 0;
                _c.label = 1;
            case 1:
                _c.trys.push([1, 3, , 4]);
                return [4 /*yield*/, fetch('https://api.x.ai/v1/models', {
                        headers: { Authorization: "Bearer ".concat(keyToUse) }
                    })];
            case 2:
                testRes = _c.sent();
                return [3 /*break*/, 4];
            case 3:
                netErr_1 = _c.sent();
                return [2 /*return*/, res.status(503).json({ status: 'error', message: "Unable to reach xAI API. Check your internet connection. (".concat(netErr_1.message, ")") })];
            case 4:
                if (testRes.ok) {
                    return [2 /*return*/, res.json({ status: 'ok', provider: 'grok', message: "Grok (xAI) API Connected \u2014 Model: ".concat(model || 'grok-2-vision-1212') })];
                }
                errBody = '';
                _c.label = 5;
            case 5:
                _c.trys.push([5, 7, , 8]);
                return [4 /*yield*/, testRes.text()];
            case 6:
                errBody = _c.sent();
                return [3 /*break*/, 8];
            case 7:
                _b = _c.sent();
                return [3 /*break*/, 8];
            case 8: return [2 /*return*/, res.status(400).json({ status: 'error', message: "xAI API authentication failed. Check your API key. [HTTP ".concat(testRes.status, "]") })];
            case 9:
                if (!(provider === 'groq')) return [3 /*break*/, 14];
                keyToUse = apiKey || process.env.GROQ_API_KEY;
                if (!keyToUse) {
                    return [2 /*return*/, res.status(400).json({ status: 'error', message: 'No Groq API Key provided. Please enter your Groq API key.' })];
                }
                testRes = void 0;
                _c.label = 10;
            case 10:
                _c.trys.push([10, 12, , 13]);
                return [4 /*yield*/, fetch('https://api.groq.com/openai/v1/models', {
                        headers: { Authorization: "Bearer ".concat(keyToUse) }
                    })];
            case 11:
                testRes = _c.sent();
                return [3 /*break*/, 13];
            case 12:
                netErr_2 = _c.sent();
                return [2 /*return*/, res.status(503).json({ status: 'error', message: "Unable to reach Groq API. Check your internet connection. (".concat(netErr_2.message, ")") })];
            case 13:
                if (testRes.ok) {
                    return [2 /*return*/, res.json({ status: 'ok', provider: 'groq', message: "Groq API Connected \u2014 Model: ".concat(model || 'meta-llama/llama-4-scout-17b-16e-instruct') })];
                }
                return [2 /*return*/, res.status(400).json({ status: 'error', message: "Groq API authentication failed. Check your API key. [HTTP ".concat(testRes.status, "]") })];
            case 14:
                ai = getGeminiClient(apiKey);
                _c.label = 15;
            case 15:
                _c.trys.push([15, 17, , 18]);
                return [4 /*yield*/, ai.models.generateContent({
                        model: model || 'gemini-2.5-flash',
                        contents: 'Reply with only: OK'
                    })];
            case 16:
                testResponse = _c.sent();
                if (testResponse) {
                    return [2 /*return*/, res.json({ status: 'ok', provider: 'google-gemini', message: "Google Gemini Connected \u2014 Model: ".concat(model || 'gemini-2.5-flash') })];
                }
                return [2 /*return*/, res.status(400).json({ status: 'error', message: 'Gemini connection test failed. Check your API key.' })];
            case 17:
                geminiErr_1 = _c.sent();
                return [2 /*return*/, res.status(400).json({ status: 'error', message: "Gemini API Error: ".concat(sanitizeErrorMessage((geminiErr_1 === null || geminiErr_1 === void 0 ? void 0 : geminiErr_1.message) || 'Authentication failed. Verify your API key.')) })];
            case 18: return [3 /*break*/, 20];
            case 19:
                err_1 = _c.sent();
                res.status(500).json({ status: 'error', message: sanitizeErrorMessage((err_1 === null || err_1 === void 0 ? void 0 : err_1.message) || 'Internal server error during key test.') });
                return [3 /*break*/, 20];
            case 20: return [2 /*return*/];
        }
    });
}); });
// ─── Admin AI Telemetry ───────────────────────────────────────────────────────
router.get('/admin/ai-telemetry', AuthMiddleware.authenticate, AuthMiddleware.requireRole('admin'), function (req, res) {
    var total = aiTelemetryLogs.length;
    var successful = aiTelemetryLogs.filter(function (l) { return l.success; }).length;
    var avgLatency = total > 0 ? Math.round(aiTelemetryLogs.reduce(function (acc, l) { return acc + l.responseTimeMs; }, 0) / total) : 0;
    var cacheHits = aiTelemetryLogs.filter(function (l) { return l.cacheHit; }).length;
    return res.json({
        totalRequests: total,
        successRate: total > 0 ? "".concat(Math.round((successful / total) * 100), "%") : '100%',
        avgResponseTimeMs: avgLatency,
        cacheHits: cacheHits,
        logs: aiTelemetryLogs.slice(0, 50)
    });
});
// ─── Marketplace Registry ─────────────────────────────────────────────────────
router.get('/marketplaces', function (req, res) {
    res.json(MARKETPLACE_REGISTRY);
});
// ─── Main AI Vision + Metadata Generation (PROTECTED) ────────────────────────
router.post('/generate-metadata', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authResult, _a, targetPlatform, marketplaceRule, metadataResult, err_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                return [4 /*yield*/, validateAuthAndSubscription(req, res)];
            case 1:
                authResult = _b.sent();
                if (!authResult)
                    return [2 /*return*/]; // Response already sent
                _a = (req.body.settings || {}).targetPlatform, targetPlatform = _a === void 0 ? 'general' : _a;
                marketplaceRule = MARKETPLACE_REGISTRY[targetPlatform] || MARKETPLACE_REGISTRY.general;
                return [4 /*yield*/, SeoEngine.generateMetadata(__assign(__assign({}, req.body), { marketplaceRule: marketplaceRule }))];
            case 2:
                metadataResult = _b.sent();
                return [2 /*return*/, res.json(metadataResult)];
            case 3:
                err_2 = _b.sent();
                console.error('Error in /api/generate-metadata:', err_2);
                return [2 /*return*/, res.status(500).json({ error: sanitizeErrorMessage((err_2 === null || err_2 === void 0 ? void 0 : err_2.message) || err_2) })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── AI Prompt Generation (PROTECTED) ────────────────────────────────────────
router.post('/generate-prompt', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authResult, promptResult, err_3;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                return [4 /*yield*/, validateAuthAndSubscription(req, res)];
            case 1:
                authResult = _a.sent();
                if (!authResult)
                    return [2 /*return*/]; // Response already sent
                return [4 /*yield*/, SeoEngine.generatePrompt(req.body)];
            case 2:
                promptResult = _a.sent();
                return [2 /*return*/, res.json(promptResult)];
            case 3:
                err_3 = _a.sent();
                console.error('Error in /api/generate-prompt:', err_3);
                return [2 /*return*/, res.status(500).json({ error: sanitizeErrorMessage((err_3 === null || err_3 === void 0 ? void 0 : err_3.message) || err_3) })];
            case 4: return [2 /*return*/];
        }
    });
}); });
export var aiRouter = router;
