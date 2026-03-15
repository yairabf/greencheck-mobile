export type Team = {
  id: string;
  name: string;
  createdBy: string;
  memberIds: string[];
  activeIncidentId: string | null;
  createdAt?: unknown;
  updatedAt?: unknown;
};
