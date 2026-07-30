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
import { PasswordService } from './password-service';
import { SessionService } from './session-service';
import { AuthValidators } from './validators';
import { OAuth2Client } from 'google-auth-library';
var AuthService = /** @class */ (function () {
    function AuthService() {
    }
    AuthService.getGoogleClient = function () {
        if (!process.env.GOOGLE_CLIENT_ID) {
            throw new Error('Google OAuth is not configured on the server. Missing GOOGLE_CLIENT_ID.');
        }
        return new OAuth2Client(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET);
    };
    AuthService.signup = function (payload, deviceFingerprint) {
        return __awaiter(this, void 0, void 0, function () {
            var fullName, email, password, confirmPassword, termsAccepted, emailValidation, cleanEmail, pwValidation, existing, isAdminEmail, userId, deviceId, passwordHash, newUser, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        fullName = payload.fullName, email = payload.email, password = payload.password, confirmPassword = payload.confirmPassword, termsAccepted = payload.termsAccepted;
                        if (!termsAccepted)
                            throw new Error('You must accept the Terms of Service.');
                        if (password !== confirmPassword)
                            throw new Error('Passwords do not match.');
                        emailValidation = AuthValidators.validateEmail(email);
                        if (!emailValidation.valid)
                            throw new Error(emailValidation.error);
                        cleanEmail = emailValidation.cleanEmail;
                        pwValidation = PasswordService.validatePasswordStrength(password);
                        if (!pwValidation.valid)
                            throw new Error(pwValidation.error);
                        return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
                    case 1:
                        existing = _a.sent();
                        if (existing)
                            throw new Error('An account with this email address already exists.');
                        isAdminEmail = this.IMMUTABLE_ADMIN_EMAILS.includes(cleanEmail);
                        userId = "usr_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                        deviceId = "dev_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                        return [4 /*yield*/, PasswordService.hashPassword(password)];
                    case 2:
                        passwordHash = _a.sent();
                        newUser = {
                            id: userId,
                            fullName: AuthValidators.sanitizeInput(fullName || 'Contributor'),
                            email: cleanEmail,
                            passwordHash: passwordHash,
                            provider: 'local',
                            role: isAdminEmail ? 'admin' : 'contributor',
                            status: isAdminEmail ? 'active' : 'pending_activation',
                            subscription: {
                                planId: 'plan_1m',
                                planName: '1 Month Plan',
                                price: 300,
                                durationDays: 30,
                                activatedAt: new Date().toISOString(),
                                expiresAt: isAdminEmail ? new Date(Date.now() + 30 * 86400000).toISOString() : new Date().toISOString(),
                                isActive: isAdminEmail,
                                isExpired: !isAdminEmail,
                                deviceId: deviceId
                            },
                            activeDeviceId: deviceId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            lastLoginAt: new Date().toISOString(),
                            totalGenerations: 0
                        };
                        return [4 /*yield*/, userStore.createUser(newUser)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, SessionService.createSession(userId, deviceId)];
                    case 4:
                        token = _a.sent();
                        return [2 /*return*/, { user: newUser, token: token }];
                }
            });
        });
    };
    AuthService.login = function (payload) {
        return __awaiter(this, void 0, void 0, function () {
            var email, password, emailValidation, cleanEmail, user, isMatch, newDeviceId, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        email = payload.email, password = payload.password;
                        emailValidation = AuthValidators.validateEmail(email);
                        if (!emailValidation.valid)
                            throw new Error('Email and password are required.');
                        cleanEmail = emailValidation.cleanEmail;
                        return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            throw new Error('Invalid email address or password.');
                        return [4 /*yield*/, PasswordService.verifyPassword(password, user.passwordHash)];
                    case 2:
                        isMatch = _a.sent();
                        if (!isMatch)
                            throw new Error('Invalid email address or password.');
                        newDeviceId = "dev_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                        return [4 /*yield*/, SessionService.createSession(user.id, newDeviceId)];
                    case 3:
                        token = _a.sent();
                        user.lastLoginAt = new Date().toISOString();
                        user.updatedAt = new Date().toISOString();
                        return [4 /*yield*/, userStore.updateUser(user.id, { lastLoginAt: user.lastLoginAt, updatedAt: user.updatedAt })];
                    case 4:
                        _a.sent();
                        return [2 /*return*/, { user: user, token: token }];
                }
            });
        });
    };
    AuthService.loginWithGoogle = function (idToken) {
        return __awaiter(this, void 0, void 0, function () {
            var client, ticket, payload, cleanEmail, user, isAdminEmail, newDeviceId, userId, token;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        client = this.getGoogleClient();
                        return [4 /*yield*/, client.verifyIdToken({
                                idToken: idToken,
                                audience: process.env.GOOGLE_CLIENT_ID,
                            })];
                    case 1:
                        ticket = _a.sent();
                        payload = ticket.getPayload();
                        if (!payload || !payload.email)
                            throw new Error('Invalid Google token payload.');
                        cleanEmail = payload.email.toLowerCase().trim();
                        return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
                    case 2:
                        user = _a.sent();
                        isAdminEmail = this.IMMUTABLE_ADMIN_EMAILS.includes(cleanEmail);
                        newDeviceId = "dev_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                        if (!!user) return [3 /*break*/, 4];
                        userId = "usr_".concat(Date.now(), "_").concat(Math.random().toString(36).substring(2, 6));
                        user = {
                            id: userId,
                            fullName: payload.name || 'Google Contributor',
                            email: cleanEmail,
                            googleId: payload.sub,
                            avatar: payload.picture,
                            provider: 'google',
                            role: isAdminEmail ? 'admin' : 'contributor',
                            status: 'active', // Auto-activate Google users
                            subscription: {
                                planId: 'plan_1m',
                                planName: '1 Month Plan',
                                price: 300,
                                durationDays: 30,
                                activatedAt: new Date().toISOString(),
                                expiresAt: isAdminEmail ? new Date(Date.now() + 30 * 86400000).toISOString() : new Date().toISOString(),
                                isActive: isAdminEmail,
                                isExpired: !isAdminEmail,
                                deviceId: newDeviceId
                            },
                            activeDeviceId: newDeviceId,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString(),
                            lastLoginAt: new Date().toISOString(),
                            totalGenerations: 0
                        };
                        return [4 /*yield*/, userStore.createUser(user)];
                    case 3:
                        _a.sent();
                        return [3 /*break*/, 6];
                    case 4:
                        user.lastLoginAt = new Date().toISOString();
                        user.updatedAt = new Date().toISOString();
                        user.googleId = payload.sub;
                        if (payload.picture && !user.avatar)
                            user.avatar = payload.picture;
                        return [4 /*yield*/, userStore.updateUser(user.id, {
                                lastLoginAt: user.lastLoginAt,
                                updatedAt: user.updatedAt,
                                googleId: user.googleId,
                                avatar: user.avatar
                            })];
                    case 5:
                        _a.sent();
                        _a.label = 6;
                    case 6: return [4 /*yield*/, SessionService.createSession(user.id, newDeviceId)];
                    case 7:
                        token = _a.sent();
                        return [2 /*return*/, { user: user, token: token }];
                }
            });
        });
    };
    // Configured in server.ts originally, but should live in auth configuration
    AuthService.IMMUTABLE_ADMIN_EMAILS = [
        'adobeicon99@gmail.com',
        'fahadhussain0282@gmail.com'
    ];
    return AuthService;
}());
export { AuthService };
