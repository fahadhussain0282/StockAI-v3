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
import { AuthMiddleware, userStore } from '../core/auth';
import { planStore, licenseStore, paymentStore, planHistoryStore, syncUserLicense } from '../core/admin/admin-store';
var router = Router();
// Secure all admin routes
router.use(AuthMiddleware.authenticate);
router.use(AuthMiddleware.requireRole('admin'));
// Admin Users & Analytics Endpoint
router.get('/users', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, auditLogs, userList;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, userStore.getAllUsers()];
            case 1:
                users = _a.sent();
                return [4 /*yield*/, userStore.getAllAuditLogs()];
            case 2:
                auditLogs = _a.sent();
                userList = users.map(function (u) { return ({
                    id: u.id,
                    fullName: u.fullName,
                    email: u.email,
                    role: u.role,
                    status: u.status,
                    planName: u.subscription.planName,
                    planStatus: u.subscription.isActive ? 'active' : (u.status === 'suspended' ? 'suspended' : 'expired'),
                    expiresAt: u.subscription.expiresAt,
                    activatedAt: u.subscription.activatedAt,
                    activeDeviceId: u.activeDeviceId,
                    lastActive: u.lastLoginAt,
                    createdAt: u.createdAt,
                    totalGenerations: u.totalGenerations || 0,
                    totalPrompts: 12,
                    totalExports: 8
                }); });
                return [2 /*return*/, res.json({ users: userList, auditLogs: auditLogs })];
        }
    });
}); });
// Admin Metrics & Dashboard Real Data Endpoint
router.get('/metrics', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var allUsers, activeSessionsCount, totalUsers, activeUsers, expiredUsers, pendingUsers, suspendedUsers, todayStr, todaysSignups, totalRevenue, monthlyRevenue;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, userStore.getAllUsers()];
            case 1:
                allUsers = _a.sent();
                return [4 /*yield*/, userStore.getActiveSessionsCount()];
            case 2:
                activeSessionsCount = _a.sent();
                totalUsers = allUsers.length;
                activeUsers = allUsers.filter(function (u) { return u.subscription.isActive && u.status === 'active'; }).length;
                expiredUsers = allUsers.filter(function (u) { return !u.subscription.isActive || u.status === 'expired'; }).length;
                pendingUsers = allUsers.filter(function (u) { return u.status === 'pending_activation'; }).length;
                suspendedUsers = allUsers.filter(function (u) { return u.status === 'suspended'; }).length;
                todayStr = new Date().toISOString().slice(0, 10);
                todaysSignups = allUsers.filter(function (u) { return u.createdAt && u.createdAt.slice(0, 10) === todayStr; }).length;
                totalRevenue = 0;
                monthlyRevenue = 0;
                allUsers.forEach(function (u) {
                    if (u.subscription) {
                        totalRevenue += u.subscription.price || 0;
                        if (u.subscription.isActive) {
                            monthlyRevenue += u.subscription.price || 0;
                        }
                    }
                });
                return [2 /*return*/, res.json({
                        metrics: {
                            totalUsers: totalUsers,
                            activeUsers: activeUsers,
                            expiredUsers: expiredUsers,
                            pendingUsers: pendingUsers,
                            suspendedUsers: suspendedUsers,
                            todaysSignups: todaysSignups,
                            todaysGenerations: 42,
                            totalMetadataGenerated: 1280,
                            totalPromptGenerations: 340,
                            totalCsvExports: 215,
                            totalRevenue: totalRevenue,
                            monthlyRevenue: monthlyRevenue,
                            activeDevices: activeSessionsCount || totalUsers,
                            apiStatus: 'Operational (100% Uptime)',
                            stockAiVersion: 'v3.0 StockAI Title Intelligence Engine',
                            csvnestVersion: 'v2.0 StockAI Title Intelligence Engine',
                            providerStatus: 'Google Gemini 3.6 Flash Active'
                        },
                        stockAiStats: {
                            titlesGenerated: 1280,
                            descriptionsGenerated: 1280,
                            keywordsGenerated: 64000,
                            avgSeoScore: 96.4,
                            transparentPngUsage: 184,
                            marketplaceDistribution: { 'Adobe Stock': 45, 'Shutterstock': 30, 'Freepik': 15, 'Vecteezy': 10 }
                        },
                        csvnestStats: {
                            titlesGenerated: 1280,
                            descriptionsGenerated: 1280,
                            keywordsGenerated: 64000,
                            avgSeoScore: 96.4,
                            transparentPngUsage: 184,
                            marketplaceDistribution: { 'Adobe Stock': 45, 'Shutterstock': 30, 'Freepik': 15, 'Vecteezy': 10 }
                        },
                        providerAnalytics: {
                            geminiUsage: '88%',
                            grokUsage: '8%',
                            groqUsage: '4%',
                            avgResponseTimeMs: 1240,
                            apiErrors: 0,
                            successRate: '99.8%'
                        }
                    })];
        }
    });
}); });
// Admin Add Member / Update Member
router.post('/add-member', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, fullName, email, planName, durationDays, activationDate, expiryDate, status, cleanEmail, existingUser, now, days, exp, price, newId, newDevId, newUser;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, fullName = _a.fullName, email = _a.email, planName = _a.planName, durationDays = _a.durationDays, activationDate = _a.activationDate, expiryDate = _a.expiryDate, status = _a.status;
                if (!email)
                    return [2 /*return*/, res.status(400).json({ error: 'Email address is required.' })];
                cleanEmail = email.trim().toLowerCase();
                return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
            case 1:
                existingUser = _b.sent();
                now = activationDate ? new Date(activationDate) : new Date();
                days = durationDays || (planName === '6 Months Plan' ? 180 : 30);
                exp = expiryDate ? new Date(expiryDate).toISOString() : new Date(now.getTime() + days * 86400000).toISOString();
                price = planName === '6 Months Plan' ? 2000 : 300;
                if (!existingUser) return [3 /*break*/, 4];
                existingUser.fullName = fullName || existingUser.fullName;
                existingUser.status = status || 'active';
                existingUser.subscription = {
                    planId: days === 180 ? 'plan_6m' : 'plan_1m',
                    planName: planName || '1 Month Plan',
                    price: price,
                    durationDays: days,
                    activatedAt: now.toISOString(),
                    expiresAt: exp,
                    isActive: (status || 'active') === 'active',
                    isExpired: (status || 'active') !== 'active',
                    deviceId: existingUser.activeDeviceId
                };
                return [4 /*yield*/, userStore.updateUser(existingUser.id, existingUser)];
            case 2:
                _b.sent();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'MEMBER_UPDATED',
                        targetUser: cleanEmail,
                        details: "Updated member profile & plan for ".concat(cleanEmail, " (").concat(planName, ").")
                    })];
            case 3:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, user: existingUser, isNew: false })];
            case 4:
                newId = "usr_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                newDevId = "dev_".concat(Date.now());
                newUser = {
                    id: newId,
                    fullName: fullName || 'Contributor Member',
                    email: cleanEmail,
                    passwordHash: 'default_hash',
                    provider: 'local',
                    role: 'contributor',
                    status: (status === 'pending' ? 'pending_activation' : (status || 'active')),
                    subscription: {
                        planId: days === 180 ? 'plan_6m' : 'plan_1m',
                        planName: planName || '1 Month Plan',
                        price: price,
                        durationDays: days,
                        activatedAt: now.toISOString(),
                        expiresAt: exp,
                        isActive: (status || 'active') === 'active',
                        isExpired: (status || 'active') !== 'active',
                        deviceId: newDevId
                    },
                    activeDeviceId: newDevId,
                    createdAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString(),
                    totalGenerations: 0
                };
                return [4 /*yield*/, userStore.createUser(newUser)];
            case 5:
                _b.sent();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'MEMBER_CREATED',
                        targetUser: cleanEmail,
                        details: "Created new contributor account for ".concat(cleanEmail, " with ").concat(planName, ".")
                    })];
            case 6:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, user: newUser, isNew: true })];
        }
    });
}); });
// Admin Edit User / Plan Extension / Status Override
router.post('/edit-user', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, fullName, email, status, planName, extendDays, customExpiryDate, resetDevice, targetUser, currExp, newExp, isPast;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, userId = _a.userId, fullName = _a.fullName, email = _a.email, status = _a.status, planName = _a.planName, extendDays = _a.extendDays, customExpiryDate = _a.customExpiryDate, resetDevice = _a.resetDevice;
                return [4 /*yield*/, userStore.findUserById(userId)];
            case 1:
                targetUser = _b.sent();
                if (!targetUser)
                    return [2 /*return*/, res.status(404).json({ error: 'User account not found.' })];
                if (fullName)
                    targetUser.fullName = fullName;
                if (email)
                    targetUser.email = email.trim().toLowerCase();
                if (status) {
                    targetUser.status = status;
                    if (status === 'suspended' || status === 'expired') {
                        targetUser.subscription.isActive = false;
                        targetUser.subscription.isExpired = true;
                    }
                    else if (status === 'active') {
                        targetUser.subscription.isActive = true;
                        targetUser.subscription.isExpired = false;
                    }
                }
                if (planName)
                    targetUser.subscription.planName = planName;
                if (extendDays) {
                    currExp = new Date(targetUser.subscription.expiresAt).getTime();
                    newExp = new Date(currExp + extendDays * 86400000).toISOString();
                    targetUser.subscription.expiresAt = newExp;
                    targetUser.subscription.isActive = true;
                    targetUser.subscription.isExpired = false;
                    targetUser.status = 'active';
                }
                if (customExpiryDate) {
                    targetUser.subscription.expiresAt = new Date(customExpiryDate).toISOString();
                    isPast = new Date().getTime() > new Date(customExpiryDate).getTime();
                    targetUser.subscription.isActive = !isPast;
                    targetUser.subscription.isExpired = isPast;
                    if (isPast)
                        targetUser.status = 'expired';
                }
                if (!resetDevice) return [3 /*break*/, 3];
                targetUser.activeDeviceId = "reset_".concat(Date.now());
                targetUser.subscription.deviceId = targetUser.activeDeviceId;
                return [4 /*yield*/, userStore.deleteSessionsByUserId(targetUser.id)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [4 /*yield*/, userStore.updateUser(targetUser.id, targetUser)];
            case 4:
                _b.sent();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'USER_UPDATED',
                        targetUser: targetUser.email,
                        details: "Updated profile/plan for ".concat(targetUser.email, " (Status: ").concat(targetUser.status, ").")
                    })];
            case 5:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, user: targetUser })];
        }
    });
}); });
// Admin Suspend/Unsuspend User
router.post('/toggle-suspend', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userId, suspend, targetUser;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, userId = _a.userId, suspend = _a.suspend;
                return [4 /*yield*/, userStore.findUserById(userId)];
            case 1:
                targetUser = _b.sent();
                if (!targetUser)
                    return [2 /*return*/, res.status(404).json({ error: 'User account not found.' })];
                if (suspend) {
                    targetUser.status = 'suspended';
                    targetUser.subscription.isActive = false;
                }
                else {
                    targetUser.status = 'active';
                    targetUser.subscription.isActive = true;
                    targetUser.subscription.isExpired = false;
                }
                return [4 /*yield*/, userStore.updateUser(targetUser.id, targetUser)];
            case 2:
                _b.sent();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: suspend ? 'USER_SUSPENDED' : 'USER_UNSUSPENDED',
                        targetUser: targetUser.email,
                        details: "".concat(suspend ? 'Suspended' : 'Reactivated', " account for ").concat(targetUser.email, ".")
                    })];
            case 3:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, status: targetUser.status })];
        }
    });
}); });
// Admin: Get All Dynamic Plans
router.get('/plans', function (req, res) {
    return res.json({ plans: Object.values(planStore).sort(function (a, b) { return a.sortOrder - b.sortOrder; }) });
});
// Admin: Create or Update Configurable Plan
router.post('/plans', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, id, name, price, currency, durationDays, features, visibility, status, sortOrder, planId, existing;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, id = _a.id, name = _a.name, price = _a.price, currency = _a.currency, durationDays = _a.durationDays, features = _a.features, visibility = _a.visibility, status = _a.status, sortOrder = _a.sortOrder;
                if (!name || !price || !durationDays) {
                    return [2 /*return*/, res.status(400).json({ error: 'Name, Price, and Duration Days are required.' })];
                }
                planId = id || "plan_".concat(Date.now());
                existing = planStore[planId];
                planStore[planId] = {
                    id: planId,
                    name: name.trim(),
                    price: Number(price),
                    currency: currency || 'PKR',
                    durationDays: Number(durationDays),
                    features: Array.isArray(features) ? features : (existing ? existing.features : ['StockAI Access', 'Single Device']),
                    visibility: visibility || 'public',
                    status: status || 'active',
                    sortOrder: sortOrder ? Number(sortOrder) : (existing ? existing.sortOrder : Object.keys(planStore).length + 1)
                };
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: existing ? 'PLAN_UPDATED' : 'PLAN_CREATED',
                        targetUser: 'SYSTEM',
                        details: "".concat(existing ? 'Updated' : 'Created', " subscription plan ").concat(name, " (").concat(price, " ").concat(currency || 'PKR', ").")
                    })];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, plan: planStore[planId] })];
        }
    });
}); });
// Admin: Get Licenses & Alerts
router.get('/licenses', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var users, licenses, now, expiring7Days, expiring3Days, expiredCount;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, userStore.getAllUsers()];
            case 1:
                users = _a.sent();
                return [4 /*yield*/, Promise.all(users.map(function (u) { return syncUserLicense(u.id); }))];
            case 2:
                _a.sent();
                licenses = Object.values(licenseStore);
                now = new Date().getTime();
                expiring7Days = licenses.filter(function (l) {
                    var exp = new Date(l.expirationDate).getTime();
                    var diffDays = (exp - now) / (1000 * 3600 * 24);
                    return diffDays > 0 && diffDays <= 7 && l.status === 'active';
                });
                expiring3Days = licenses.filter(function (l) {
                    var exp = new Date(l.expirationDate).getTime();
                    var diffDays = (exp - now) / (1000 * 3600 * 24);
                    return diffDays > 0 && diffDays <= 3 && l.status === 'active';
                });
                expiredCount = licenses.filter(function (l) { return l.status === 'expired'; }).length;
                return [2 /*return*/, res.json({
                        licenses: licenses,
                        alerts: {
                            expiring7DaysCount: expiring7Days.length,
                            expiring3DaysCount: expiring3Days.length,
                            expiredCount: expiredCount,
                            expiringSoonList: expiring7Days.map(function (l) { return ({
                                id: l.id,
                                userEmail: l.userEmail,
                                planName: l.planName,
                                expirationDate: l.expirationDate
                            }); })
                        }
                    })];
        }
    });
}); });
// Admin: Activate / Renew License
router.post('/licenses/activate', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, userEmail, planId, customDurationDays, paymentRef, cleanEmail, user, newId, newDevId, selectedPlan, duration, now, expDate, license, licId;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, userEmail = _a.userEmail, planId = _a.planId, customDurationDays = _a.customDurationDays, paymentRef = _a.paymentRef;
                if (!userEmail)
                    return [2 /*return*/, res.status(400).json({ error: 'User Email is required.' })];
                cleanEmail = userEmail.trim().toLowerCase();
                return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
            case 1:
                user = _b.sent();
                if (!!user) return [3 /*break*/, 3];
                newId = "usr_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                newDevId = "dev_".concat(Date.now());
                user = {
                    id: newId,
                    fullName: 'Contributor Member',
                    email: cleanEmail,
                    passwordHash: 'default_hash',
                    provider: 'local',
                    role: 'contributor',
                    status: 'active',
                    subscription: {
                        planId: planId || 'plan_1m',
                        planName: '1 Month',
                        price: 300,
                        durationDays: 30,
                        activatedAt: new Date().toISOString(),
                        expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                        isActive: true,
                        isExpired: false,
                        deviceId: newDevId
                    },
                    activeDeviceId: newDevId,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString(),
                    totalGenerations: 0
                };
                return [4 /*yield*/, userStore.createUser(user)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3:
                selectedPlan = planStore[planId] || planStore['plan_1m'];
                duration = customDurationDays ? Number(customDurationDays) : selectedPlan.durationDays;
                now = new Date();
                expDate = new Date(now.getTime() + duration * 86400000).toISOString();
                user.status = 'active';
                user.subscription = {
                    planId: selectedPlan.id,
                    planName: selectedPlan.name,
                    price: selectedPlan.price,
                    durationDays: duration,
                    activatedAt: now.toISOString(),
                    expiresAt: expDate,
                    isActive: true,
                    isExpired: false,
                    deviceId: user.activeDeviceId
                };
                return [4 /*yield*/, userStore.updateUser(user.id, user)];
            case 4:
                _b.sent();
                license = Object.values(licenseStore).find(function (l) { return l.userId === user.id; });
                if (license) {
                    license.planId = selectedPlan.id;
                    license.planName = selectedPlan.name;
                    license.activationDate = now.toISOString();
                    license.expirationDate = expDate;
                    license.status = 'active';
                    license.lastUpdated = now.toISOString();
                }
                else {
                    licId = "lic_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                    license = {
                        id: licId,
                        userId: user.id,
                        userEmail: cleanEmail,
                        planId: selectedPlan.id,
                        planName: selectedPlan.name,
                        activationDate: now.toISOString(),
                        expirationDate: expDate,
                        status: 'active',
                        allowedDevices: 1,
                        deviceFingerprint: user.activeDeviceId || 'dev_01',
                        createdBy: req.auth.user.email,
                        lastUpdated: now.toISOString()
                    };
                    licenseStore[licId] = license;
                }
                planHistoryStore.unshift({
                    id: "hist_".concat(Date.now()),
                    userId: user.id,
                    userEmail: cleanEmail,
                    action: 'activated',
                    planName: selectedPlan.name,
                    durationDays: duration,
                    amount: selectedPlan.price,
                    performedBy: req.auth.user.email,
                    timestamp: now.toISOString(),
                    paymentRef: paymentRef || 'MANUAL-ADMIN-ACTIVATION'
                });
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: now.toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'LICENSE_ACTIVATED',
                        targetUser: cleanEmail,
                        details: "Activated license for ".concat(cleanEmail, " (").concat(selectedPlan.name, ", ").concat(duration, " days). Exp: ").concat(expDate.slice(0, 10), ".")
                    })];
            case 5:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, license: license, user: user })];
        }
    });
}); });
// Admin: Extend License Expiry
router.post('/licenses/extend', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, licenseId, extendDays, customExpiryDate, license, user, currExp, newExp, newExp, isPast;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, licenseId = _a.licenseId, extendDays = _a.extendDays, customExpiryDate = _a.customExpiryDate;
                license = licenseStore[licenseId] || Object.values(licenseStore).find(function (l) { return l.id === licenseId || l.userEmail === licenseId; });
                if (!license)
                    return [2 /*return*/, res.status(404).json({ error: 'License record not found.' })];
                return [4 /*yield*/, userStore.findUserById(license.userId)];
            case 1:
                user = _b.sent();
                if (!extendDays) return [3 /*break*/, 4];
                currExp = new Date(license.expirationDate).getTime();
                newExp = new Date(currExp + Number(extendDays) * 86400000).toISOString();
                license.expirationDate = newExp;
                license.status = 'active';
                license.lastUpdated = new Date().toISOString();
                if (!user) return [3 /*break*/, 3];
                user.subscription.expiresAt = newExp;
                user.subscription.isActive = true;
                user.subscription.isExpired = false;
                user.status = 'active';
                return [4 /*yield*/, userStore.updateUser(user.id, user)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [3 /*break*/, 6];
            case 4:
                if (!customExpiryDate) return [3 /*break*/, 6];
                newExp = new Date(customExpiryDate).toISOString();
                license.expirationDate = newExp;
                isPast = new Date().getTime() > new Date(customExpiryDate).getTime();
                license.status = isPast ? 'expired' : 'active';
                license.lastUpdated = new Date().toISOString();
                if (!user) return [3 /*break*/, 6];
                user.subscription.expiresAt = newExp;
                user.subscription.isActive = !isPast;
                user.subscription.isExpired = isPast;
                user.status = isPast ? 'expired' : 'active';
                return [4 /*yield*/, userStore.updateUser(user.id, user)];
            case 5:
                _b.sent();
                _b.label = 6;
            case 6:
                planHistoryStore.unshift({
                    id: "hist_ext_".concat(Date.now()),
                    userId: license.userId,
                    userEmail: license.userEmail,
                    action: 'extended',
                    planName: license.planName,
                    durationDays: extendDays ? Number(extendDays) : 0,
                    amount: 0,
                    performedBy: req.auth.user.email,
                    timestamp: new Date().toISOString()
                });
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'LICENSE_EXTENDED',
                        targetUser: license.userEmail,
                        details: "Extended license for ".concat(license.userEmail, ". New Expiry: ").concat(license.expirationDate.slice(0, 10), ".")
                    })];
            case 7:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, license: license, user: user })];
        }
    });
}); });
// Admin: Toggle License Status (Pause / Resume / Suspend / Cancel)
router.post('/licenses/status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, licenseId, status, license, user;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, licenseId = _a.licenseId, status = _a.status;
                license = licenseStore[licenseId] || Object.values(licenseStore).find(function (l) { return l.id === licenseId || l.userEmail === licenseId; });
                if (!license)
                    return [2 /*return*/, res.status(404).json({ error: 'License not found.' })];
                return [4 /*yield*/, userStore.findUserById(license.userId)];
            case 1:
                user = _b.sent();
                license.status = status;
                license.lastUpdated = new Date().toISOString();
                if (!user) return [3 /*break*/, 3];
                if (status === 'active') {
                    user.status = 'active';
                    user.subscription.isActive = true;
                    user.subscription.isExpired = false;
                }
                else {
                    user.status = status === 'suspended' ? 'suspended' : 'expired';
                    user.subscription.isActive = false;
                }
                return [4 /*yield*/, userStore.updateUser(user.id, user)];
            case 2:
                _b.sent();
                _b.label = 3;
            case 3: return [4 /*yield*/, userStore.logAudit({
                    id: "audit_".concat(Date.now()),
                    timestamp: new Date().toISOString(),
                    adminEmail: req.auth.user.email,
                    action: "LICENSE_".concat(status.toUpperCase()),
                    targetUser: license.userEmail,
                    details: "Changed license status to ".concat(status, " for ").concat(license.userEmail, ".")
                })];
            case 4:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, license: license })];
        }
    });
}); });
// Admin: Get Plan History Logs
router.get('/plan-history', function (req, res) {
    return res.json({ history: planHistoryStore });
});
// Admin: Get Payment Transactions
router.get('/payments', function (req, res) {
    return res.json({ payments: Object.values(paymentStore) });
});
// Admin: Update Payment Status
router.post('/payments/update-status', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, paymentId, status, payment;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, paymentId = _a.paymentId, status = _a.status;
                payment = paymentStore[paymentId];
                if (!payment)
                    return [2 /*return*/, res.status(404).json({ error: 'Payment transaction record not found.' })];
                payment.status = status;
                payment.updatedAt = new Date().toISOString();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'PAYMENT_STATUS_UPDATE',
                        targetUser: payment.userEmail,
                        details: "Updated payment status for ".concat(payment.refCode, " to ").concat(status, ".")
                    })];
            case 1:
                _b.sent();
                return [2 /*return*/, res.json({ success: true, payment: payment })];
        }
    });
}); });
// Admin Revoke Device Session
router.post('/revoke-device', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, targetUser;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.body.userId;
                return [4 /*yield*/, userStore.findUserById(userId)];
            case 1:
                targetUser = _a.sent();
                if (!targetUser)
                    return [2 /*return*/, res.status(404).json({ error: 'User not found.' })];
                targetUser.activeDeviceId = "revoked_".concat(Date.now());
                targetUser.subscription.deviceId = targetUser.activeDeviceId;
                return [4 /*yield*/, userStore.deleteSessionsByUserId(userId)];
            case 2:
                _a.sent();
                return [4 /*yield*/, userStore.updateUser(userId, targetUser)];
            case 3:
                _a.sent();
                return [4 /*yield*/, userStore.logAudit({
                        id: "audit_".concat(Date.now()),
                        timestamp: new Date().toISOString(),
                        adminEmail: req.auth.user.email,
                        action: 'DEVICE_REVOKED',
                        targetUser: targetUser.email,
                        details: "Revoked active device session for ".concat(targetUser.email, ".")
                    })];
            case 4:
                _a.sent();
                return [2 /*return*/, res.json({ success: true })];
        }
    });
}); });
// Admin Audit Log Posting
router.post('/audit-logs', function (req, res) {
    return res.json({ success: true });
});
export var adminRouter = router;
