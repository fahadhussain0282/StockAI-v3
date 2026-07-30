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
import { OrganizationService } from './organization-service';
import { TeamService } from './team-service';
import { WorkspaceService } from './workspace-service';
import { InvitationService } from './invitation-service';
import { MembershipService } from './membership-service';
export var teamRouter = Router();
// Secure all routes
teamRouter.use(AuthMiddleware.authenticate);
// --- Organizations ---
teamRouter.post('/v1/org', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, name, plan, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.auth.user.id;
                _a = req.body, name = _a.name, plan = _a.plan;
                return [4 /*yield*/, OrganizationService.createOrganization(name, userId, plan)];
            case 1:
                result = _b.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ org: result.org });
                return [2 /*return*/];
        }
    });
}); });
teamRouter.delete('/v1/org/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, OrganizationService.deleteOrganization(req.params.id, userId)];
            case 1:
                result = _a.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(403).json({ errors: result.errors })];
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
// --- Teams ---
teamRouter.post('/v1/team', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, orgId, name, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.auth.user.id;
                _a = req.body, orgId = _a.orgId, name = _a.name;
                return [4 /*yield*/, TeamService.createTeam(orgId, name, userId)];
            case 1:
                result = _b.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ team: result.team });
                return [2 /*return*/];
        }
    });
}); });
teamRouter.get('/v1/team', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, orgId, teams;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                orgId = req.query.orgId;
                if (typeof orgId !== 'string')
                    return [2 /*return*/, res.status(400).json({ error: 'Missing orgId' })];
                return [4 /*yield*/, TeamService.getTeams(orgId, userId)];
            case 1:
                teams = _a.sent();
                res.json({ teams: teams });
                return [2 /*return*/];
        }
    });
}); });
teamRouter.post('/v1/team/:id/archive', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, orgId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                orgId = req.body.orgId;
                return [4 /*yield*/, TeamService.archiveTeam(orgId, req.params.id, userId)];
            case 1:
                result = _a.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(403).json({ errors: result.errors })];
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
// --- Workspaces ---
teamRouter.post('/v1/workspace', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, orgId, teamId, name, type, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.auth.user.id;
                _a = req.body, orgId = _a.orgId, teamId = _a.teamId, name = _a.name, type = _a.type;
                return [4 /*yield*/, WorkspaceService.createWorkspace(orgId, teamId, name, type, userId)];
            case 1:
                result = _b.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ workspace: result.workspace });
                return [2 /*return*/];
        }
    });
}); });
// --- Invitations ---
teamRouter.post('/v1/invitations', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, _a, orgId, teamId, email, role, result;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userId = req.auth.user.id;
                _a = req.body, orgId = _a.orgId, teamId = _a.teamId, email = _a.email, role = _a.role;
                return [4 /*yield*/, InvitationService.sendInvite(orgId, teamId, email, role, userId)];
            case 1:
                result = _b.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ invitation: result.invitation });
                return [2 /*return*/];
        }
    });
}); });
// --- Members ---
teamRouter.post('/v1/members/accept', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, token, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                token = req.body.token;
                return [4 /*yield*/, MembershipService.acceptInvite(token, userId)];
            case 1:
                result = _a.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ membership: result.membership });
                return [2 /*return*/];
        }
    });
}); });
teamRouter.delete('/v1/members/:id', function (req, res) { return __awaiter(void 0, void 0, void 0, function () {
    var userId, result;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                userId = req.auth.user.id;
                return [4 /*yield*/, MembershipService.removeMember(req.params.id, userId)];
            case 1:
                result = _a.sent();
                if (result.errors)
                    return [2 /*return*/, res.status(400).json({ errors: result.errors })];
                res.json({ success: true });
                return [2 /*return*/];
        }
    });
}); });
