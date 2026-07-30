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
import { subscriptionStore } from './store';
import { generateId, emitBillingEvent } from './utils';
import { PlanService } from './plan-service';
import { CreditService } from './credit-service';
var SubscriptionService = /** @class */ (function () {
    function SubscriptionService() {
    }
    SubscriptionService.getActiveSubscription = function (orgId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, subscriptionStore.findByOrgId(orgId)];
            });
        });
    };
    SubscriptionService.createSubscription = function (orgId, planId, provider, providerSubscriptionId) {
        return __awaiter(this, void 0, void 0, function () {
            var plan, existing, currentPeriodStart, currentPeriodEnd, sub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PlanService.getPlan(planId)];
                    case 1:
                        plan = _a.sent();
                        if (!plan)
                            return [2 /*return*/, { errors: ['Invalid plan ID'] }];
                        return [4 /*yield*/, this.getActiveSubscription(orgId)];
                    case 2:
                        existing = _a.sent();
                        if (existing && existing.status === 'ACTIVE') {
                            return [2 /*return*/, { errors: ['Organization already has an active subscription'] }];
                        }
                        currentPeriodStart = new Date().toISOString();
                        currentPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
                        sub = {
                            id: generateId('sub'),
                            orgId: orgId,
                            planId: planId,
                            status: 'ACTIVE',
                            provider: provider,
                            providerSubscriptionId: providerSubscriptionId,
                            currentPeriodStart: currentPeriodStart,
                            currentPeriodEnd: currentPeriodEnd,
                            cancelAtPeriodEnd: false,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        return [4 /*yield*/, subscriptionStore.create(sub)];
                    case 3:
                        _a.sent();
                        emitBillingEvent('SubscriptionCreated', { subscriptionId: sub.id, orgId: orgId, planId: planId });
                        // Initialize/Top-up credits for the new plan
                        return [4 /*yield*/, CreditService.topUpCredits(orgId, plan.limits.monthlyCredits, 'SUBSCRIPTION_RENEWAL')];
                    case 4:
                        // Initialize/Top-up credits for the new plan
                        _a.sent();
                        return [2 /*return*/, { subscription: sub }];
                }
            });
        });
    };
    SubscriptionService.cancelSubscription = function (orgId) {
        return __awaiter(this, void 0, void 0, function () {
            var sub;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getActiveSubscription(orgId)];
                    case 1:
                        sub = _a.sent();
                        if (!sub)
                            return [2 /*return*/, { success: false, errors: ['No active subscription found'] }];
                        // In a real app, call Provider.cancelSubscription here
                        return [4 /*yield*/, subscriptionStore.update(sub.id, { cancelAtPeriodEnd: true, status: 'CANCELED' })];
                    case 2:
                        // In a real app, call Provider.cancelSubscription here
                        _a.sent();
                        emitBillingEvent('SubscriptionCanceled', { subscriptionId: sub.id, orgId: orgId });
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return SubscriptionService;
}());
export { SubscriptionService };
