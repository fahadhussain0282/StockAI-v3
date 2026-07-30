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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
// In-Memory implementation mimicking a future DB client (Prisma/TypeORM)
var UserStoreImpl = /** @class */ (function () {
    function UserStoreImpl() {
        this.users = new Map();
        this.sessions = new Map();
        this.auditLogs = [];
        this.resetTokens = new Map();
        this.seedInitialData();
    }
    // Users
    UserStoreImpl.prototype.findUserById = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.users.get(id) || null];
            });
        });
    };
    UserStoreImpl.prototype.findUserByEmail = function (email) {
        return __awaiter(this, void 0, void 0, function () {
            var _i, _a, user;
            return __generator(this, function (_b) {
                for (_i = 0, _a = this.users.values(); _i < _a.length; _i++) {
                    user = _a[_i];
                    if (user.email.toLowerCase() === email.toLowerCase()) {
                        return [2 /*return*/, user];
                    }
                }
                return [2 /*return*/, null];
            });
        });
    };
    UserStoreImpl.prototype.getAllUsers = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, Array.from(this.users.values())];
            });
        });
    };
    UserStoreImpl.prototype.getAllAuditLogs = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, __spreadArray([], this.auditLogs, true)];
            });
        });
    };
    UserStoreImpl.prototype.getActiveSessionsCount = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sessions.size];
            });
        });
    };
    UserStoreImpl.prototype.createUser = function (user) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findUserByEmail(user.email)];
                    case 1:
                        if (_a.sent()) {
                            throw new Error('User with this email already exists.');
                        }
                        this.users.set(user.id, user);
                        return [2 /*return*/];
                }
            });
        });
    };
    UserStoreImpl.prototype.updateUser = function (id, updates) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.findUserById(id)];
                    case 1:
                        user = _a.sent();
                        if (user) {
                            this.users.set(id, __assign(__assign({}, user), updates));
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    // Sessions
    UserStoreImpl.prototype.findSessionByToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, this.sessions.get(token) || null];
            });
        });
    };
    UserStoreImpl.prototype.findSessionsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var userSessions, _i, _a, session;
            return __generator(this, function (_b) {
                userSessions = [];
                for (_i = 0, _a = this.sessions.values(); _i < _a.length; _i++) {
                    session = _a[_i];
                    if (session.userId === userId) {
                        userSessions.push(session);
                    }
                }
                return [2 /*return*/, userSessions];
            });
        });
    };
    UserStoreImpl.prototype.createSession = function (session) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.sessions.set(session.token, session);
                return [2 /*return*/];
            });
        });
    };
    UserStoreImpl.prototype.deleteSession = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.sessions.delete(token);
                return [2 /*return*/];
            });
        });
    };
    UserStoreImpl.prototype.deleteSessionsByUserId = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var tokensToDelete, _i, _a, _b, token, session;
            var _this = this;
            return __generator(this, function (_c) {
                tokensToDelete = [];
                for (_i = 0, _a = this.sessions.entries(); _i < _a.length; _i++) {
                    _b = _a[_i], token = _b[0], session = _b[1];
                    if (session.userId === userId) {
                        tokensToDelete.push(token);
                    }
                }
                tokensToDelete.forEach(function (token) { return _this.sessions.delete(token); });
                return [2 /*return*/];
            });
        });
    };
    // Password Reset Tokens
    UserStoreImpl.prototype.createResetToken = function (userId, token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Token expires in 1 hour
                this.resetTokens.set(token, { userId: userId, expiresAt: Date.now() + 60 * 60 * 1000 });
                return [2 /*return*/];
            });
        });
    };
    UserStoreImpl.prototype.validateResetToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            var entry;
            return __generator(this, function (_a) {
                entry = this.resetTokens.get(token);
                if (!entry)
                    return [2 /*return*/, null];
                if (entry.expiresAt < Date.now()) {
                    this.resetTokens.delete(token);
                    return [2 /*return*/, null];
                }
                return [2 /*return*/, entry.userId];
            });
        });
    };
    UserStoreImpl.prototype.deleteResetToken = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.resetTokens.delete(token);
                return [2 /*return*/];
            });
        });
    };
    // Audit
    UserStoreImpl.prototype.logAudit = function (log) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                this.auditLogs.unshift(log);
                return [2 /*return*/];
            });
        });
    };
    // Seeding — admin users only (no demo/test users)
    // NOTE: These seeded admins use a special marker that the password verification
    // falls back to plaintext comparison. Admins should reset via Admin Panel after first login.
    UserStoreImpl.prototype.seedInitialData = function () {
        // SECURITY: seeded admin users are stored with a legacy marker.
        // They are NEVER auto-logged in. They must authenticate through the login form.
        // The in-memory store resets on each deploy — this is expected behavior
        // for the current architecture. Real activation happens via admin panel.
        this.users.set('usr_admin_1', {
            id: 'usr_admin_1',
            fullName: 'Fahad Hussain',
            email: 'fahadhussain0282@gmail.com',
            // SECURITY: Using legacy marker. Admin must login with their known password.
            // Password will be upgraded to PBKDF2 on first login via the update flow.
            passwordHash: 'legacy:admin_seed_1',
            provider: 'local',
            role: 'admin',
            status: 'active',
            subscription: {
                planId: 'plan_1m',
                planName: '1 Month Plan',
                price: 300,
                durationDays: 30,
                activatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 30 * 86400000).toISOString(),
                isActive: true,
                isExpired: false,
                deviceId: 'dev_admin_01'
            },
            activeDeviceId: 'dev_admin_01',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            totalGenerations: 124
        });
        this.users.set('usr_admin_2', {
            id: 'usr_admin_2',
            fullName: 'Adobe Icon Studio',
            email: 'adobeicon99@gmail.com',
            passwordHash: 'legacy:admin_seed_2',
            provider: 'local',
            role: 'admin',
            status: 'active',
            subscription: {
                planId: 'plan_6m',
                planName: '6 Months Plan',
                price: 2000,
                durationDays: 180,
                activatedAt: new Date().toISOString(),
                expiresAt: new Date(Date.now() + 180 * 86400000).toISOString(),
                isActive: true,
                isExpired: false,
                deviceId: 'dev_admin_02'
            },
            activeDeviceId: 'dev_admin_02',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
            totalGenerations: 532
        });
        this.auditLogs.push({
            id: 'audit_1',
            timestamp: new Date().toISOString(),
            adminEmail: 'fahadhussain0282@gmail.com',
            action: 'SYSTEM_BOOT',
            targetUser: 'SYSTEM',
            details: 'Enterprise Authentication Architecture initialized. StockAI v1.1'
        });
    };
    return UserStoreImpl;
}());
// Export a singleton instance representing the DB connection
export var userStore = new UserStoreImpl();
