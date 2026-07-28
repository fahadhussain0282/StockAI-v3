export const TEAMS_CONSTANTS = {
  INVITE_EXPIRATION_HOURS: 48,
  NAME_MIN_LENGTH: 3,
  NAME_MAX_LENGTH: 50,
};

export const QUOTAS = {
  FREE: {
    maxOrganizations: 1,
    maxTeams: 3,
    maxMembersPerTeam: 5,
    maxWorkspaces: 5,
    maxPendingInvites: 10
  },
  PRO: {
    maxOrganizations: 5,
    maxTeams: 25,
    maxMembersPerTeam: 100,
    maxWorkspaces: 999999, // practically unlimited
    maxPendingInvites: 999999
  },
  ENTERPRISE: {
    maxOrganizations: 999999,
    maxTeams: 999999,
    maxMembersPerTeam: 999999,
    maxWorkspaces: 999999,
    maxPendingInvites: 999999
  }
};
