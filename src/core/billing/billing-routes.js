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
import { AuthMiddleware } from '../auth/auth-middleware';
import { PlanService } from './plan-service';
import { SubscriptionService } from './subscription-service';
import { CreditService } from './credit-service';
import { UsageService } from './usage-service';
import { InvoiceService } from './invoice-service';
import { CheckoutService } from './checkout-service';
export var billingRouter = Router();
// Secure all routes
billingRouter.use(AuthMiddleware.authenticate);
// --- Plans ---
billingRouter.get('/v1/billing/plans', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var plans;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, PlanService.getAllPlans()];
            case 1:
                plans = _a.sent();
                res.json({ plans: plans });
                return [2 /*return*/];
        }
    });
}); });
// --- Subscriptions ---
billingRouter.get('/v1/subscriptions', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orgId, subscription;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                orgId = req.query.orgId;
                if (!orgId)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing orgId' })];
                return [4 /*yield*/, SubscriptionService.getActiveSubscription(orgId)];
            case 1:
                subscription = _a.sent();
                res.json({ subscription: subscription });
                return [2 /*return*/];
        }
    });
}); });
billingRouter.delete('/v1/subscriptions', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orgId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                orgId = req.body.orgId;
                if (!orgId)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing orgId' })];
                return [4 /*yield*/, SubscriptionService.cancelSubscription(orgId)];
            case 1:
                result = _a.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
// --- Credits ---
billingRouter.get('/v1/credits', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orgId, ledger;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                orgId = req.query.orgId;
                if (!orgId)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing orgId' })];
                return [4 /*yield*/, CreditService.getLedger(orgId)];
            case 1:
                ledger = _a.sent();
                res.json({ ledger: ledger });
                return [2 /*return*/];
        }
    });
}); });
// --- Usage ---
billingRouter.get('/v1/usage', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, orgId, metric, startDate, endDate, amount;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.query, orgId = _a.orgId, metric = _a.metric, startDate = _a.startDate, endDate = _a.endDate;
                if (!orgId || !metric || !startDate || !endDate)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required parameters' })];
                return [4 /*yield*/, UsageService.getUsageForPeriod(orgId, metric, startDate, endDate)];
            case 1:
                amount = _b.sent();
                res.json({ amount: amount });
                return [2 /*return*/];
        }
    });
}); });
// --- Invoices ---
billingRouter.get('/v1/invoices', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var orgId, invoices;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                orgId = req.query.orgId;
                if (!orgId)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing orgId' })];
                return [4 /*yield*/, InvoiceService.getInvoices(orgId)];
            case 1:
                invoices = _a.sent();
                res.json({ invoices: invoices });
                return [2 /*return*/];
        }
    });
}); });
// --- Checkout ---
billingRouter.post('/v1/checkout', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, orgId, planId, provider, successUrl, cancelUrl, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, orgId = _a.orgId, planId = _a.planId, provider = _a.provider, successUrl = _a.successUrl, cancelUrl = _a.cancelUrl;
                if (!orgId || !planId || !provider || !successUrl || !cancelUrl) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing required parameters' })];
                }
                return [4 /*yield*/, CheckoutService.createCheckoutSession(orgId, planId, provider, successUrl, cancelUrl)];
            case 1:
                result = _b.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ url: result.url });
                return [2 /*return*/];
        }
    });
}); });
