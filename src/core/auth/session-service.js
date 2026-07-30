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
import { userStore } from './user-store';
import { TokenService } from './token-service';
var SessionService = /** @class */ (function () {
    function SessionService() {
    }
    /**
     * Creates a new session and enforces the single-device limit.
     */
    SessionService.createSession = function (userId, deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var token, session;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // 1 Active Device Enforcement: invalidate previous sessions for this user
                    return [4 /*yield*/, userStore.deleteSessionsByUserId(userId)];
                    case 1:
                        // 1 Active Device Enforcement: invalidate previous sessions for this user
                        _a.sent();
                        return [4 /*yield*/, TokenService.generateSessionToken(userId)];
                    case 2:
                        token = _a.sent();
                        session = {
                            userId: userId,
                            deviceId: deviceId,
                            token: token,
                            createdAt: new Date().toISOString(),
                            expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // 30 days
                        };
                        return [4 /*yield*/, userStore.createSession(session)];
                    case 3:
                        _a.sent();
                        // Update active device on user
                        return [4 /*yield*/, userStore.updateUser(userId, { activeDeviceId: deviceId, lastLoginAt: new Date().toISOString() })];
                    case 4:
                        // Update active device on user
                        _a.sent();
                        return [2 /*return*/, token];
                }
            });
        });
    };
    /**
     * Validates a session token. Returns the UserRecord if valid.
     */
    SessionService.validateSession = function (token, deviceId) {
        return __awaiter(this, void 0, void 0, function () {
            var session, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userStore.findSessionByToken(token)];
                    case 1:
                        session = _a.sent();
                        if (!session)
                            return [2 /*return*/, null];
                        if (!(new Date(session.expiresAt).getTime() < Date.now())) return [3 /*break*/, 3];
                        return [4 /*yield*/, userStore.deleteSession(token)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, null];
                    case 3: return [4 /*yield*/, userStore.findUserById(session.userId)];
                    case 4:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, null];
                        if (!(deviceId && user.activeDeviceId && user.activeDeviceId !== deviceId)) return [3 /*break*/, 6];
                        // This means the user logged in elsewhere since this token was issued
                        return [4 /*yield*/, userStore.deleteSession(token)];
                    case 5:
                        // This means the user logged in elsewhere since this token was issued
                        _a.sent();
                        return [2 /*return*/, null];
                    case 6: return [2 /*return*/, { user: user, sessionToken: token }];
                }
            });
        });
    };
    /**
     * Terminates a specific session.
     */
    SessionService.terminateSession = function (token) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userStore.deleteSession(token)];
                    case 1:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    return SessionService;
}());
export { SessionService };
