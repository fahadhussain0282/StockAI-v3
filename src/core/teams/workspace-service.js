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
import { workspaceStore, organizationStore, teamStore, auditStore } from './store';
import { generateId, emitEvent } from './utils';
import { QUOTAS } from './constants';
import { PermissionService } from './permission-service';
import { validateName } from './validators';
var WorkspaceService = /** @class */ (function () {
    function WorkspaceService() {
    }
    WorkspaceService.createWorkspace = function (orgId, teamId, name, type, userId) {
        return __awaiter(this, void 0, void 0, function () {
            var org, team, orgWorkspaces, limit, workspace;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        if (!validateName(name))
                            return [2 /*return*/, { errors: ['Invalid workspace name'] }];
                        return [4 /*yield*/, PermissionService.canManageWorkspace(orgId, teamId, userId)];
                    case 1:
                        if (!(_a.sent())) {
                            return [2 /*return*/, { errors: ['Unauthorized to create workspace in this team'] }];
                        }
                        return [4 /*yield*/, organizationStore.findById(orgId)];
                    case 2:
                        org = _a.sent();
                        if (!org)
                            return [2 /*return*/, { errors: ['Organization not found'] }];
                        return [4 /*yield*/, teamStore.findById(teamId)];
                    case 3:
                        team = _a.sent();
                        if (!team)
                            return [2 /*return*/, { errors: ['Team not found'] }];
                        return [4 /*yield*/, workspaceStore.findByTeamId(teamId)];
                    case 4:
                        orgWorkspaces = _a.sent();
                        limit = QUOTAS[org.plan].maxWorkspaces;
                        if (orgWorkspaces.length >= limit) { // Simplification: using team count for now
                            return [2 /*return*/, { errors: ["Maximum workspace limit reached for your ".concat(org.plan, " plan")] }];
                        }
                        workspace = {
                            id: generateId('ws'),
                            teamId: teamId,
                            orgId: orgId,
                            name: name,
                            type: type,
                            createdAt: new Date().toISOString(),
                            updatedAt: new Date().toISOString()
                        };
                        return [4 /*yield*/, workspaceStore.create(workspace)];
                    case 5:
                        _a.sent();
                        return [4 /*yield*/, auditStore.create({
                                id: generateId('audit'),
                                actor: userId,
                                action: 'WORKSPACE_CREATED',
                                resource: 'Workspace',
                                resourceId: workspace.id,
                                orgId: orgId,
                                teamId: teamId,
                                timestamp: new Date().toISOString()
                            })];
                    case 6:
                        _a.sent();
                        emitEvent('WorkspaceCreated', { workspaceId: workspace.id, teamId: teamId, orgId: orgId });
                        return [2 /*return*/, { workspace: workspace }];
                }
            });
        });
    };
    WorkspaceService.getWorkspaces = function (teamId, userId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // In a real app, verify user has access to this team's workspaces
                return [2 /*return*/, workspaceStore.findByTeamId(teamId)];
            });
        });
    };
    return WorkspaceService;
}());
export { WorkspaceService };
