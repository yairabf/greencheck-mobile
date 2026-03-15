export type Incident = {
  id: string;
  teamId: string;
  status: 'active' | 'closed';
  triggeredBy: string;
  triggeredAt?: unknown;
  endedBy?: string | null;
  endedAt?: unknown;
  autoClosed: boolean;
  allSafe?: boolean;
};
