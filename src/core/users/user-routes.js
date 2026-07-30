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
import { ProfileService } from './profile-service';
import { PreferencesService } from './preferences-service';
import { ActivityService } from './activity-service';
import { AvatarService } from './avatar-service';
import { AccountService } from './account-service';
import { NotificationService } from './notification-service';
export var userRouter = Router();
// Apply auth middleware to all user routes
userRouter.use(AuthMiddleware.authenticate);
// Profile
userRouter.get('/profile', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, profile;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, ProfileService.getProfile(userId)];
            case 1:
                profile = _a.sent();
                res.json({ profile: profile });
                return [2 /*return*/];
        }
    });
}); });
userRouter.put('/profile', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, ProfileService.updateProfile(userId, req.body)];
            case 1:
                result = _a.sent();
                if (result.errors) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ profile: result.profile });
                return [2 /*return*/];
        }
    });
}); });
// Preferences
userRouter.get('/preferences', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, preferences;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, PreferencesService.getPreferences(userId)];
            case 1:
                preferences = _a.sent();
                res.json({ preferences: preferences });
                return [2 /*return*/];
        }
    });
}); });
userRouter.put('/preferences', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, PreferencesService.updatePreferences(userId, req.body)];
            case 1:
                result = _a.sent();
                if (result.errors) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ preferences: result.preferences });
                return [2 /*return*/];
        }
    });
}); });
// Activity
userRouter.get('/activity', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, activities, summary;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, ActivityService.getRecentActivity(userId)];
            case 1:
                activities = _a.sent();
                return [4 /*yield*/, ActivityService.getSummary(userId)];
            case 2:
                summary = _a.sent();
                res.json({ activities: activities, summary: summary });
                return [2 /*return*/];
        }
    });
}); });
// Notifications
userRouter.get('/notifications', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, unreadOnly, notifications;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                unreadOnly = req.query.unread === 'true';
                return [4 /*yield*/, NotificationService.getNotifications(userId, unreadOnly)];
            case 1:
                notifications = _a.sent();
                res.json({ notifications: notifications });
                return [2 /*return*/];
        }
    });
}); });
userRouter.post('/notifications/:id/read', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, NotificationService.markAsRead(userId, req.params.id)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
// Avatar
userRouter.post('/avatar', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, fileData, mimeType, sizeBytes, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.auth.user.id;
                _a = req.body, fileData = _a.fileData, mimeType = _a.mimeType, sizeBytes = _a.sizeBytes;
                if (!fileData || !mimeType || !sizeBytes) {
                    return [2 /*return*/, res.status(400).json({ error: 'Missing avatar data payload' })];
                }
                return [4 /*yield*/, AvatarService.uploadAvatar(userId, fileData, mimeType, sizeBytes)];
            case 1:
                result = _b.sent();
                if (result.errors) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ avatar: result.result });
                return [2 /*return*/];
        }
    });
}); });
userRouter.delete('/avatar', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, AvatarService.removeAvatar(userId)];
            case 1:
                _a.sent();
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
// Account Settings
userRouter.post('/account/email', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, newEmail, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                newEmail = req.body.newEmail;
                if (!newEmail)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing new email' })];
                return [4 /*yield*/, AccountService.changeEmail(userId, newEmail)];
            case 1:
                result = _a.sent();
                if (!result.success) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
userRouter.post('/account/password', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, newPassword, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                newPassword = req.body.newPassword;
                if (!newPassword)
                    return [2 /*return*/, res.status(400).json({ error: 'Missing new password' })];
                return [4 /*yield*/, AccountService.changePassword(userId, newPassword)];
            case 1:
                result = _a.sent();
                if (!result.success) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
userRouter.delete('/account', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, AccountService.deactivateAccount(userId)];
            case 1:
                result = _a.sent();
                if (!result.success) {
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                }
                res.json({ success: true, message: 'Account deactivated.' });
                return [2 /*return*/];
        }
    });
}); });
