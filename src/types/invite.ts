export type TeamInvite = {
  code: string;
  teamId: string;
  createdBy: string;
  createdAt?: unknown;
  expiresAt?: unknown;
  active: boolean;
};
