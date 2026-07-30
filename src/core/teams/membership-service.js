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
import { membershipStore, invitationStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
var MembershipService = /** @class */ (function () {
    function MembershipService() {
    }
    MembershipService.acceptInvite = function (token, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var invite, existing, existing, membership;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, invitationStore.findByToken(token)];
                    case 1:
                        invite = _a.sent();
                        if (!invite)
                            return [2 /*return*/, { errors: ['Invalid or expired invitation token'] }];
                        if (invite.status !== 'PENDING')
                            return [2 /*return*/, { errors: ['Invitation is no longer valid'] }];
                        if (!(new Date(invite.expiresAt).getTime() < Date.now())) return [3 /*break*/, 3];
                        return [4 /*yield*/, invitationStore.updateStatus(invite.id, 'EXPIRED')];
                    case 2:
                        _a.sent();
                        return [2 /*return*/, { errors: ['Invitation has expired'] }];
                    case 3:
                        if (!invite.teamId) return [3 /*break*/, 5];
                        return [4 /*yield*/, membershipStore.findByTeamAndUser(invite.teamId, userId)];
                    case 4:
                        existing = _a.sent();
                        if (existing)
                            return [2 /*return*/, { errors: ['Already a member of this team'] }];
                        return [3 /*break*/, 7];
                    case 5: return [4 /*yield*/, membershipStore.findByOrgAndUser(invite.orgId, userId)];
                    case 6:
                        existing = _a.sent();
                        if (existing)
                            return [2 /*return*/, { errors: ['Already a member of this organization'] }];
                        _a.label = 7;
                    case 7:
                        membership = {
                            id: generateId('mem'),
                            orgId: invite.orgId,
                            teamId: invite.teamId,
                            userId: userId,
                            role: invite.role,
                            status: 'ACTIVE',
                            joinedAt: new Date().toISOString()
                        };
                        return [4 /*yield*/, membershipStore.create(membership)];
                    case 8:
                        _a.sent();
                        return [4 /*yield*/, invitationStore.updateStatus(invite.id, 'ACCEPTED')];
                    case 9:
                        _a.sent();
                        return [4 /*yield*/, auditStore.create({
                                id: generateId('audit'),
                                actor: userId,
                                action: 'INVITE_ACCEPTED',
                                resource: 'Membership',
                                resourceId: membership.id,
                                orgId: invite.orgId,
                                teamId: invite.teamId,
                                timestamp: new Date().toISOString()
                            })];
                    case 10:
                        _a.sent();
                        emitEvent('InviteAccepted', { invitationId: invite.id, membershipId: membership.id, userId: userId });
                        return [2 /*return*/, { membership: membership }];
                }
            });
        });
    };
    MembershipService.removeMember = function (membershipId, actorId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Basic implementation: would require PermissionService to check if actorId can remove this user
                    return [4 /*yield*/, membershipStore.remove(membershipId)];
                    case 1:
                        // Basic implementation: would require PermissionService to check if actorId can remove this user
                        _a.sent();
                        emitEvent('MemberRemoved', { membershipId: membershipId, removedBy: actorId });
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return MembershipService;
}());
export { MembershipService };
