import { Router, Request, Response } from 'express';
import { AuthMiddleware } from '../auth/auth-middleware';
import { OrganizationService } from './organization-service';
import { TeamService } from './team-service';
import { WorkspaceService } from './workspace-service';
import { InvitationService } from './invitation-service';
import { MembershipService } from './membership-service';

export const teamRouter = Router();

// Secure all routes
teamRouter.use(AuthMiddleware.authenticate);

// --- Organizations ---
teamRouter.post('/v1/org', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { name, plan } = req.body;
  const result = await OrganizationService.createOrganization(name, userId, plan);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ org: result.org });
});

teamRouter.delete('/v1/org/:id', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const result = await OrganizationService.deleteOrganization(req.params.id, userId);
  if (result.errors) return res.status(403).json({ errors: result.errors });
  res.json({ success: true });
});

// --- Teams ---
teamRouter.post('/v1/team', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { orgId, name } = req.body;
  const result = await TeamService.createTeam(orgId, name, userId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ team: result.team });
});

teamRouter.get('/v1/team', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { orgId } = req.query;
  if (typeof orgId !== 'string') return res.status(400).json({ error: 'Missing orgId' });
  const teams = await TeamService.getTeams(orgId, userId);
  res.json({ teams });
});

teamRouter.post('/v1/team/:id/archive', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { orgId } = req.body;
  const result = await TeamService.archiveTeam(orgId, req.params.id, userId);
  if (result.errors) return res.status(403).json({ errors: result.errors });
  res.json({ success: true });
});

// --- Workspaces ---
teamRouter.post('/v1/workspace', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { orgId, teamId, name, type } = req.body;
  const result = await WorkspaceService.createWorkspace(orgId, teamId, name, type, userId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ workspace: result.workspace });
});

// --- Invitations ---
teamRouter.post('/v1/invitations', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { orgId, teamId, email, role } = req.body;
  const result = await InvitationService.sendInvite(orgId, teamId, email, role, userId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ invitation: result.invitation });
});

// --- Members ---
teamRouter.post('/v1/members/accept', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const { token } = req.body;
  const result = await MembershipService.acceptInvite(token, userId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ membership: result.membership });
});

teamRouter.delete('/v1/members/:id', async (req: Request, res: Response) => {
  const userId = req.auth!.user.id;
  const result = await MembershipService.removeMember(req.params.id, userId);
  if (result.errors) return res.status(400).json({ errors: result.errors });
  res.json({ success: true });
});
