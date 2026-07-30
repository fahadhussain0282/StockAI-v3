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
import { organizationStore, membershipStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
import { validateName } from './validators';
import { QUOTAS } from './constants';
import { PermissionService } from './permission-service';
var OrganizationService = /** @class */ (function () {
    function OrganizationService() {
    }
    OrganizationService.createOrganization = function (name_1, ownerId_1) {
        return __awaiter(this, arguments, void 0, function (name, ownerId, plan) {
            var mems, ownerOrgs, org;
            if (plan === void 0) { plan = 'FREE'; }
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validateName(name))
                            return [2 /*return*/, { errors: ['Invalid organization name'] }];
                        return [4 /*yield*/, membershipStore.findByUserId(ownerId)];
                    case 1:
                        mems = _a.sent();
                        ownerOrgs = mems.filter(function (m) { return m.role === 'OWNER'; });
                        // Assuming FREE tier maxOrgs for user checking
                        if (ownerOrgs.length >= QUOTAS.FREE.maxOrganizations) {
                            return [2 /*return*/, { errors: ['Maximum organization limit reached for your plan'] }];
                        }
                        org = {
                            id: generateId('org'),
                            name: name,
                            ownerId: ownerId,
                            plan: plan,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        return [4 /*yield*/, organizationStore.create(org)];
                    case 2:
                        _a.sent();
                        // Automatically create OWNER membership
                        return [4 /*yield*/, membershipStore.create({
                                id: generateId('mem'),
                                orgId: org.id,
                                userId: ownerId,
                                role: 'OWNER',
                                status: 'ACTIVE',
                                joinedAt: new Date().toISOString()
                            })];
                    case 3:
                        // Automatically create OWNER membership
                        _a.sent();
                        return [4 /*yield*/, auditStore.create({
                                id: generateId('audit'),
                                actor: ownerId,
                                action: 'ORGANIZATION_CREATED',
                                resource: 'Organization',
                                resourceId: org.id,
                                orgId: org.id,
                                timestamp: new Date().toISOString()
                            })];
                    case 4:
                        _a.sent();
                        emitEvent('OrganizationCreated', { orgId: org.id, ownerId: ownerId });
                        return [2 /*return*/, { org: org }];
                }
            });
        });
    };
    OrganizationService.getOrganization = function (id) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/, organizationStore.findById(id)];
            });
        });
    };
    OrganizationService.deleteOrganization = function (id, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, PermissionService.canDeleteOrganization(id, userId)];
                    case 1:
                        if (!(_a.sent())) {
                            return [2 /*return*/, { success: false, errors: ['Unauthorized to delete organization'] }];
                        }
                        return [4 /*yield*/, organizationStore.delete(id)];
                    case 2:
                        _a.sent();
                        emitEvent('OrganizationDeleted', { orgId: id, deletedBy: userId });
                        return [2 /*return*/, { success: true }];
                }
            });
        });
    };
    return OrganizationService;
}());
export { OrganizationService };
