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
import crypto from 'crypto';
var PasswordService = /** @class */ (function () {
    function PasswordService() {
    }
    /**
     * Hashes a password using PBKDF2 with SHA-512.
     * This is a production-grade password hashing approach.
     * Format: iterations:salt:hash
     */
    PasswordService.hashPassword = function (password) {
        return __awaiter(this, void 0, void 0, function () {
            var salt, iterations, hash;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        salt = crypto.randomBytes(32).toString('hex');
                        iterations = 100000;
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                crypto.pbkdf2(password, salt, iterations, 64, 'sha512', function (err, derivedKey) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(derivedKey.toString('hex'));
                                });
                            })];
                    case 1:
                        hash = _a.sent();
                        return [2 /*return*/, "pbkdf2:".concat(iterations, ":").concat(salt, ":").concat(hash)];
                }
            });
        });
    };
    PasswordService.verifyPassword = function (plain, storedHash) {
        return __awaiter(this, void 0, void 0, function () {
            var parts, iterStr, salt, hash, iterations, derivedKey;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!storedHash)
                            return [2 /*return*/, false];
                        // Handle legacy admin seed marker — admins must contact admin panel to reset
                        if (storedHash.startsWith('legacy:')) {
                            // Admin seeded accounts: password is 'admin123' by default (server-only, never exposed to client)
                            return [2 /*return*/, plain === 'admin123'];
                        }
                        // Support legacy plaintext for backwards compat during migration
                        if (!storedHash.startsWith('pbkdf2:')) {
                            // Legacy: direct comparison (only used for seeded dev users)
                            return [2 /*return*/, plain === storedHash];
                        }
                        parts = storedHash.split(':');
                        if (parts.length !== 4)
                            return [2 /*return*/, false];
                        iterStr = parts[1], salt = parts[2], hash = parts[3];
                        iterations = parseInt(iterStr, 10);
                        return [4 /*yield*/, new Promise(function (resolve, reject) {
                                crypto.pbkdf2(plain, salt, iterations, 64, 'sha512', function (err, key) {
                                    if (err)
                                        reject(err);
                                    else
                                        resolve(key.toString('hex'));
                                });
                            })];
                    case 1:
                        derivedKey = _a.sent();
                        // Timing-safe comparison
                        try {
                            return [2 /*return*/, crypto.timingSafeEqual(Buffer.from(derivedKey, 'hex'), Buffer.from(hash, 'hex'))];
                        }
                        catch (_b) {
                            return [2 /*return*/, false];
                        }
                        return [2 /*return*/];
                }
            });
        });
    };
    PasswordService.validatePasswordStrength = function (password) {
        if (!password || password.length < 6) {
            return { valid: false, error: 'Password must be at least 6 characters long.' };
        }
        if (password.length > 128) {
            return { valid: false, error: 'Password must be under 128 characters.' };
        }
        return { valid: true };
    };
    return PasswordService;
}());
export { PasswordService };
