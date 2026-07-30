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
import { DEFAULT_PREFERENCES } from './constants';
// In-Memory store mimicking DB for enterprise user management
var UserManagementStoreImpl = /** @class */ (function () {
    function UserManagementStoreImpl() {
        this.profiles = new Map();
        this.preferences = new Map();
        this.activities = new Map();
        this.notifications = new Map();
        this.auditLogs = [];
    }
    // Profile Methods
    UserManagementStoreImpl.prototype.getProfile = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.profiles.get(userId) || null];
            });
        });
    };
    UserManagementStoreImpl.prototype.createOrUpdateProfile = function (userId, profileData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updated;
            return __generator(this, function (_a) {
                existing = this.profiles.get(userId) || {
                    userId: userId,
                    displayName: '',
                    username: "user_".concat(userId.substring(0, 5)),
                    avatarUrl: null,
                    bio: '',
                    country: '',
                    timezone: 'UTC',
                    language: 'en-US',
                    company: '',
                    website: '',
                    socialLinks: {},
                    profileVisibility: 'public'
                };
                updated = __assign(__assign({}, existing), profileData);
                this.profiles.set(userId, updated);
                return [2 /*return*/, updated];
            });
        });
    };
    // Preferences Methods
    UserManagementStoreImpl.prototype.getPreferences = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.preferences.get(userId) || __assign({ userId: userId }, DEFAULT_PREFERENCES)];
            });
        });
    };
    UserManagementStoreImpl.prototype.updatePreferences = function (userId, prefsData) {
        return __awaiter(this, void 0, void 0, function () {
            var existing, updated;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.getPreferences(userId)];
                    case 1:
                        existing = _a.sent();
                        updated = __assign(__assign({}, existing), prefsData);
                        this.preferences.set(userId, updated);
                        return [2 /*return*/, updated];
                }
            });
        });
    };
    // Activity Methods
    UserManagementStoreImpl.prototype.logActivity = function (activity) {
        return __awaiter(this, void 0, void 0, function () {
            var userActivities;
            return __generator(this, function (_a) {
                userActivities = this.activities.get(activity.userId) || [];
                userActivities.unshift(activity); // Add to beginning
                this.activities.set(activity.userId, userActivities);
                return [2 /*return*/];
            });
        });
    };
    UserManagementStoreImpl.prototype.getActivities = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, limit) {
            var userActivities;
            if (limit === void 0) { limit = 50; }
            return __generator(this, function (_a) {
                userActivities = this.activities.get(userId) || [];
                return [2 /*return*/, userActivities.slice(0, limit)];
            });
        });
    };
    UserManagementStoreImpl.prototype.getActivitySummary = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userActivities, uploads, exports, prompts, benchmarks, lastLogin, _i, userActivities_1, act;
            return __generator(this, function (_a) {
                userActivities = this.activities.get(userId) || [];
                uploads = 0;
                exports = 0;
                prompts = 0;
                benchmarks = 0;
                lastLogin = null;
                for (_i = 0, userActivities_1 = userActivities; _i < userActivities_1.length; _i++) {
                    act = userActivities_1[_i];
                    if (act.action === 'LOGIN' && !lastLogin)
                        lastLogin = act.timestamp;
                    if (act.action === 'UPLOAD')
                        uploads++;
                    if (act.action === 'EXPORT')
                        exports++;
                    if (act.action === 'GENERATE_PROMPT')
                        prompts++;
                    if (act.action === 'RUN_BENCHMARK')
                        benchmarks++;
                }
                return [2 /*return*/, {
                        lastLogin: lastLogin,
                        totalUploads: uploads,
                        totalExports: exports,
                        totalPromptsGenerated: prompts,
                        totalBenchmarkRuns: benchmarks
                    }];
            });
        });
    };
    // Notification Methods
    UserManagementStoreImpl.prototype.addNotification = function (notification) {
        return __awaiter(this, void 0, void 0, function () {
            var userNotifs;
            return __generator(this, function (_a) {
                userNotifs = this.notifications.get(notification.userId) || [];
                userNotifs.unshift(notification);
                this.notifications.set(notification.userId, userNotifs);
                return [2 /*return*/];
            });
        });
    };
    UserManagementStoreImpl.prototype.getNotifications = function (userId_1) {
        return __awaiter(this, arguments, void 0, function (userId, unreadOnly) {
            var userNotifs;
            if (unreadOnly === void 0) { unreadOnly = false; }
            return __generator(this, function (_a) {
                userNotifs = this.notifications.get(userId) || [];
                if (unreadOnly) {
                    return [2 /*return*/, userNotifs.filter(function (n) { return !n.read; })];
                }
                return [2 /*return*/, userNotifs];
            });
        });
    };
    UserManagementStoreImpl.prototype.markNotificationAsRead = function (userId, notificationId) {
        return __awaiter(this, void 0, void 0, function () {
            var userNotifs, notif;
            return __generator(this, function (_a) {
                userNotifs = this.notifications.get(userId) || [];
                notif = userNotifs.find(function (n) { return n.id === notificationId; });
                if (notif) {
                    notif.read = true;
                }
                return [2 /*return*/];
            });
        });
    };
    // Audit Methods (Dedicated to User Actions)
    UserManagementStoreImpl.prototype.logAudit = function (log) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.auditLogs.unshift(log);
                return [2 /*return*/];
            });
        });
    };
    return UserManagementStoreImpl;
}());
export var userManagementStore = new UserManagementStoreImpl();
