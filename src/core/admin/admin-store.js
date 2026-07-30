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
import { userStore } from '../auth';
export var planStore = {
    'plan_1m': {
        id: 'plan_1m',
        name: '1 Month',
        price: 300,
        currency: 'PKR',
        durationDays: 30,
        features: ['StockAI Intelligence', 'Metadata Generator', 'Prompt Generator', 'Transparent PNG', 'CSV Export', 'Single Device'],
        visibility: 'public',
        status: 'active',
        isDefault: true,
        sortOrder: 1
    },
    'plan_6m': {
        id: 'plan_6m',
        name: '6 Months',
        price: 2000,
        currency: 'PKR',
        durationDays: 180,
        features: ['All Premium Features', 'Transparent PNG', 'Marketplace Export', 'Priority Vision Processing', 'StockAI Intelligence', 'Single Device'],
        visibility: 'public',
        status: 'active',
        isDefault: false,
        sortOrder: 2
    },
    'plan_agency': {
        id: 'plan_agency',
        name: 'Agency Enterprise',
        price: 5000,
        currency: 'PKR',
        durationDays: 365,
        features: ['Unlimited Generations', 'Priority Vision Processing', 'Dedicated Account Manager', 'Multi-Device License (Custom)'],
        visibility: 'hidden',
        status: 'active',
        isDefault: false,
        sortOrder: 3
    }
};
export var licenseStore = {
    'lic_admin_1': {
        id: 'lic_admin_1',
        userId: 'usr_admin_1',
        userEmail: 'fahadhussain0282@gmail.com',
        planId: 'plan_1m',
        planName: '1 Month',
        activationDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 30 * 86400000).toISOString(),
        status: 'active',
        allowedDevices: 1,
        deviceFingerprint: 'dev_admin_01',
        createdBy: 'SYSTEM',
        lastUpdated: new Date().toISOString()
    },
    'lic_admin_2': {
        id: 'lic_admin_2',
        userId: 'usr_admin_2',
        userEmail: 'adobeicon99@gmail.com',
        planId: 'plan_6m',
        planName: '6 Months',
        activationDate: new Date().toISOString(),
        expirationDate: new Date(Date.now() + 180 * 86400000).toISOString(),
        status: 'active',
        allowedDevices: 1,
        deviceFingerprint: 'dev_admin_02',
        createdBy: 'SYSTEM',
        lastUpdated: new Date().toISOString()
    }
};
export var paymentStore = {};
export var planHistoryStore = [
    {
        id: 'hist_init_1',
        userId: 'usr_admin_1',
        userEmail: 'fahadhussain0282@gmail.com',
        action: 'activated',
        planName: '1 Month',
        durationDays: 30,
        amount: 300,
        performedBy: 'SYSTEM',
        timestamp: new Date().toISOString(),
        paymentRef: 'REF-ADMIN-01'
    },
    {
        id: 'hist_init_2',
        userId: 'usr_admin_2',
        userEmail: 'adobeicon99@gmail.com',
        action: 'activated',
        planName: '6 Months',
        durationDays: 180,
        amount: 2000,
        performedBy: 'SYSTEM',
        timestamp: new Date().toISOString(),
        paymentRef: 'REF-ADMIN-02'
    }
];
export var INTERNAL_WHATSAPP_NUMBERS = {
    sales: '923413516882',
    support: '923394377311'
};
export function syncUserLicense(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var user, license, now, updated, exp, exp;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: return [4 /*yield*/, userStore.findUserById(userId)];
                case 1:
                    user = _a.sent();
                    if (!user)
                        return [2 /*return*/, null];
                    license = Object.values(licenseStore).find(function (l) { return l.userId === userId; });
                    now = new Date().getTime();
                    updated = false;
                    if (license) {
                        exp = new Date(license.expirationDate).getTime();
                        if (now > exp && license.status === 'active') {
                            license.status = 'expired';
                            license.lastUpdated = new Date().toISOString();
                            user.subscription.isActive = false;
                            user.subscription.isExpired = true;
                            user.status = 'expired';
                            planHistoryStore.unshift({
                                id: "hist_exp_".concat(Date.now()),
                                userId: user.id,
                                userEmail: user.email,
                                action: 'expired',
                                planName: license.planName,
                                durationDays: user.subscription.durationDays,
                                amount: user.subscription.price,
                                performedBy: 'EXPIRATION_ENGINE',
                                timestamp: new Date().toISOString()
                            });
                            updated = true;
                        }
                        else if (license.status === 'active' && !user.subscription.isActive) {
                            user.subscription.isActive = true;
                            user.subscription.isExpired = false;
                            if (user.status === 'expired' || user.status === 'pending_activation') {
                                user.status = 'active';
                            }
                            updated = true;
                        }
                    }
                    else {
                        exp = new Date(user.subscription.expiresAt).getTime();
                        if (now > exp && user.subscription.isActive) {
                            user.subscription.isActive = false;
                            user.subscription.isExpired = true;
                            user.status = 'expired';
                            updated = true;
                        }
                    }
                    if (!updated) return [3 /*break*/, 3];
                    return [4 /*yield*/, userStore.updateUser(user.id, user)];
                case 2:
                    _a.sent();
                    _a.label = 3;
                case 3: return [2 /*return*/, user];
            }
        });
    });
}
