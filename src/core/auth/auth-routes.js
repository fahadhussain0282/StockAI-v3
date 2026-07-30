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
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
import { Router } from 'express';
import { AuthService } from './auth-service';
import { AuthMiddleware } from './auth-middleware';
import { userStore } from './user-store';
import { PasswordService } from './password-service';
import crypto from 'crypto';
var router = Router();
// ─── Request Logger (Step 5 — Server Logging) ────────────────────────────────
function logRequest(label, data) {
    var ts = new Date().toISOString();
    console.log("\n[StockAI Auth][".concat(ts, "] \u25B6 ").concat(label));
    if (data !== undefined) {
        console.log('  Data:', JSON.stringify(data, null, 2));
    }
}
// ─── Signup Route ─────────────────────────────────────────────────────────────
router.post('/signup', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var deviceFingerprint, result, err_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logRequest('POST /api/auth/signup', {
                    email: req.body.email,
                    fullName: req.body.fullName,
                    termsAccepted: req.body.termsAccepted,
                    hasPassword: Boolean(req.body.password),
                    hasConfirmPassword: Boolean(req.body.confirmPassword)
                });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                deviceFingerprint = req.body.deviceFingerprint || {
                    userAgent: req.headers['user-agent'],
                    platform: 'unknown'
                };
                logRequest('Signup — Hashing password...');
                return [4 /*yield*/, AuthService.signup(req.body, JSON.stringify(deviceFingerprint))];
            case 2:
                result = _a.sent();
                logRequest('Signup — SUCCESS', { userId: result.user.id, email: result.user.email });
                return [2 /*return*/, res.json(result)];
            case 3:
                err_1 = _a.sent();
                console.error('[StockAI Auth] Signup ERROR:', err_1.message);
                console.error('[StockAI Auth] Stack:', err_1.stack);
                return [2 /*return*/, res.status(400).json({ error: err_1.message || 'Signup failed.' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── Login Route ──────────────────────────────────────────────────────────────
router.post('/login', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_2;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                logRequest('POST /api/auth/login', { email: req.body.email, hasPassword: Boolean(req.body.password) });
                _a.label = 1;
            case 1:
                _a.trys.push([1, 3, , 4]);
                return [4 /*yield*/, AuthService.login(req.body)];
            case 2:
                result = _a.sent();
                logRequest('Login — SUCCESS', { userId: result.user.id });
                return [2 /*return*/, res.json(result)];
            case 3:
                err_2 = _a.sent();
                console.error('[StockAI Auth] Login ERROR:', err_2.message);
                return [2 /*return*/, res.status(401).json({ error: err_2.message || 'Login failed.' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── Google Login Route ───────────────────────────────────────────────────────
router.post('/google', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var result, err_3;
    var _a;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                logRequest('POST /api/auth/google', {
                    hasIdToken: Boolean(req.body.idToken),
                    idTokenLength: (_a = req.body.idToken) === null || _a === void 0 ? void 0 : _a.length,
                    GOOGLE_CLIENT_ID_SET: Boolean(process.env.GOOGLE_CLIENT_ID),
                    GOOGLE_CLIENT_SECRET_SET: Boolean(process.env.GOOGLE_CLIENT_SECRET)
                });
                _b.label = 1;
            case 1:
                _b.trys.push([1, 3, , 4]);
                if (!req.body.idToken) {
                    return [2 /*return*/, res.status(400).json({ error: 'Google ID token is required.' })];
                }
                if (!process.env.GOOGLE_CLIENT_ID) {
                    console.error('[StockAI Auth] CRITICAL: GOOGLE_CLIENT_ID environment variable is NOT SET on the server.');
                    console.error('[StockAI Auth] Add GOOGLE_CLIENT_ID to your .env file and to Vercel Environment Variables.');
                    return [2 /*return*/, res.status(503).json({
                            error: 'Google OAuth is not configured on this server. The administrator must set GOOGLE_CLIENT_ID.'
                        })];
                }
                return [4 /*yield*/, AuthService.loginWithGoogle(req.body.idToken)];
            case 2:
                result = _b.sent();
                logRequest('Google Login — SUCCESS', { userId: result.user.id, email: result.user.email });
                return [2 /*return*/, res.json(result)];
            case 3:
                err_3 = _b.sent();
                console.error('[StockAI Auth] Google Login ERROR:', err_3.message);
                console.error('[StockAI Auth] Stack:', err_3.stack);
                return [2 /*return*/, res.status(401).json({ error: err_3.message || 'Google authentication failed.' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── Get Current User (Me) Route ──────────────────────────────────────────────
router.get('/me', AuthMiddleware.authenticate, function (req, res) {
    if (!req.auth) {
        return res.status(401).json({ error: 'Unauthorized.' });
    }
    var _a = req.auth.user, passwordHash = _a.passwordHash, safeUser = __rest(_a, ["passwordHash"]);
    return res.json({ user: safeUser });
});
// ─── Logout Route ─────────────────────────────────────────────────────────────
router.post('/logout', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, SessionService, err_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 4, , 5]);
                authHeader = req.headers['authorization'];
                if (!(authHeader && authHeader.startsWith('Bearer '))) return [3 /*break*/, 3];
                token = authHeader.substring(7);
                return [4 /*yield*/, import('./session-service')];
            case 1:
                SessionService = (_a.sent()).SessionService;
                return [4 /*yield*/, SessionService.terminateSession(token)];
            case 2:
                _a.sent();
                _a.label = 3;
            case 3: return [2 /*return*/, res.json({ success: true, message: 'Logged out successfully.' })];
            case 4:
                err_4 = _a.sent();
                return [2 /*return*/, res.status(500).json({ error: 'Logout failed.' })];
            case 5: return [2 /*return*/];
        }
    });
}); });
// ─── Forgot Password Route ────────────────────────────────────────────────────
router.post('/forgot-password', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var email, cleanEmail, user, resetToken, err_5;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 3, , 4]);
                email = req.body.email;
                if (!email || !email.includes('@')) {
                    return [2 /*return*/, res.status(400).json({ error: 'A valid email address is required.' })];
                }
                cleanEmail = email.toLowerCase().trim();
                return [4 /*yield*/, userStore.findUserByEmail(cleanEmail)];
            case 1:
                user = _a.sent();
                // Security: always return success even if email not found (prevents email enumeration)
                if (!user) {
                    return [2 /*return*/, res.json({
                            success: true,
                            message: 'If this email exists in our system, password reset instructions have been sent.'
                        })];
                }
                resetToken = crypto.randomBytes(32).toString('hex');
                return [4 /*yield*/, userStore.createResetToken(user.id, resetToken)];
            case 2:
                _a.sent();
                // In production: send email via SendGrid/SES/Nodemailer
                // For now: log to console for admin review
                console.log("[StockAI] Password Reset Token for ".concat(cleanEmail, ": ").concat(resetToken));
                console.log("[StockAI] Reset URL: ".concat(process.env.APP_URL || 'https://stockai.vercel.app', "/reset-password?token=").concat(resetToken));
                return [2 /*return*/, res.json(__assign({ success: true, message: 'If this email exists in our system, password reset instructions have been sent.' }, (process.env.NODE_ENV !== 'production' && { devResetToken: resetToken })))];
            case 3:
                err_5 = _a.sent();
                console.error('[StockAI] Forgot password error:', err_5);
                return [2 /*return*/, res.status(500).json({ error: 'Password reset request failed. Please try again.' })];
            case 4: return [2 /*return*/];
        }
    });
}); });
// ─── Reset Password Route ─────────────────────────────────────────────────────
router.post('/reset-password', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, token, newPassword, confirmPassword, userId, pwValidation, newHash, err_6;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 6, , 7]);
                _a = req.body, token = _a.token, newPassword = _a.newPassword, confirmPassword = _a.confirmPassword;
                if (!token || typeof token !== 'string') {
                    return [2 /*return*/, res.status(400).json({ error: 'A valid reset token is required.' })];
                }
                if (!newPassword || newPassword.length < 6) {
                    return [2 /*return*/, res.status(400).json({ error: 'Password must be at least 6 characters.' })];
                }
                if (newPassword !== confirmPassword) {
                    return [2 /*return*/, res.status(400).json({ error: 'Passwords do not match.' })];
                }
                return [4 /*yield*/, userStore.validateResetToken(token)];
            case 1:
                userId = _b.sent();
                if (!userId) {
                    return [2 /*return*/, res.status(400).json({ error: 'This reset link has expired or is invalid. Please request a new one.' })];
                }
                pwValidation = PasswordService.validatePasswordStrength(newPassword);
                if (!pwValidation.valid) {
                    return [2 /*return*/, res.status(400).json({ error: pwValidation.error })];
                }
                return [4 /*yield*/, PasswordService.hashPassword(newPassword)];
            case 2:
                newHash = _b.sent();
                return [4 /*yield*/, userStore.updateUser(userId, {
                        passwordHash: newHash,
                        updatedAt: new Date().toISOString()
                    })];
            case 3:
                _b.sent();
                return [4 /*yield*/, userStore.deleteResetToken(token)];
            case 4:
                _b.sent();
                // Invalidate all sessions for security after password reset
                return [4 /*yield*/, userStore.deleteSessionsByUserId(userId)];
            case 5:
                // Invalidate all sessions for security after password reset
                _b.sent();
                return [2 /*return*/, res.json({
                        success: true,
                        message: 'Password has been reset successfully. Please log in with your new password.'
                    })];
            case 6:
                err_6 = _b.sent();
                console.error('[StockAI] Reset password error:', err_6);
                return [2 /*return*/, res.status(500).json({ error: 'Password reset failed. Please try again.' })];
            case 7: return [2 /*return*/];
        }
    });
}); });
export var authRouter = router;
