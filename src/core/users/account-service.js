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
import { userStore } from '../auth/user-store';
import { ActivityService } from './activity-service';
import { AuditService } from './audit-service';
import { NotificationService } from './notification-service';
import { validateEmailChange, validatePasswordChange } from './validators';
var AccountService = /** @class */ (function () {
    function AccountService() {
    }
    AccountService.changeEmail = function (userId, newEmail) {
        return __awaiter(this, void 0, void 0, function () {
            var existingUser, user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validateEmailChange(newEmail)) {
                            return [2 /*return*/, { success: false, errors: ['Invalid email format.'] }];
                        }
                        return [4 /*yield*/, userStore.findUserByEmail(newEmail)];
                    case 1:
                        existingUser = _a.sent();
                        if (existingUser && existingUser.id !== userId) {
                            return [2 /*return*/, { success: false, errors: ['Email is already in use by another account.'] }];
                        }
                        return [4 /*yield*/, userStore.findUserById(userId)];
                    case 2:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, { success: false, errors: ['User not found.'] }];
                        return [4 /*yield*/, userStore.updateUser(userId, { email: newEmail })];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, ActivityService.log(userId, 'CHANGE_EMAIL')];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, AuditService.recordEvent(user.email, 'EMAIL_CHANGE', userId, "Changed email to ".concat(newEmail))];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, NotificationService.sendInAppNotification(userId, 'alert', 'Email Changed', 'Your account email address was recently updated.')];
                    case 6:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    AccountService.changePassword = function (userId, newPassword) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validatePasswordChange(newPassword)) {
                            return [2 /*return*/, { success: false, errors: ['Password does not meet complexity requirements.'] }];
                        }
                        return [4 /*yield*/, userStore.findUserById(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, { success: false, errors: ['User not found.'] }];
                        // In a real app, hash the password using bcrypt.
                        return [4 /*yield*/, userStore.updateUser(userId, { passwordHash: newPassword })];
                    case 2:
                        // In a real app, hash the password using bcrypt.
                        _a.sent();
                        return [4 /*yield*/, ActivityService.log(userId, 'CHANGE_PASSWORD')];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, AuditService.recordEvent(user.email, 'PASSWORD_CHANGE', userId, 'Changed password')];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, NotificationService.sendInAppNotification(userId, 'alert', 'Password Changed', 'Your account password was recently updated. If this was not you, please contact support immediately.')];
                    case 5:
                        _a.sent();
                        // Revoke other sessions.
                        return [4 /*yield*/, userStore.deleteSessionsByUserId(userId)];
                    case 6:
                        // Revoke other sessions.
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    AccountService.deactivateAccount = function (userId) {
        return __awaiter(this, void 0, void 0, function () {
            var user;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, userStore.findUserById(userId)];
                    case 1:
                        user = _a.sent();
                        if (!user)
                            return [2 /*return*/, { success: false, errors: ['User not found.'] }];
                        return [4 /*yield*/, userStore.updateUser(userId, { status: 'suspended' })];
                    case 2:
                        _a.sent();
                        return [4 /*yield*/, userStore.deleteSessionsByUserId(userId)];
                    case 3:
                        _a.sent();
                        return [4 /*yield*/, ActivityService.log(userId, 'DEACTIVATE_ACCOUNT')];
                    case 4:
                        _a.sent();
                        return [4 /*yield*/, AuditService.recordEvent(user.email, 'ACCOUNT_DEACTIVATED', userId, 'User deactivated their own account')];
                    case 5:
                        _a.sent();
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return AccountService;
}());
export { AccountService };
