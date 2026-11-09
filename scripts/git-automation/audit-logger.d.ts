export interface AuditEntry {
  projectId: string;
  projectSlug: string;
  mode: string;
  remoteUrl?: string;
  commitHash?: string;
  commitMessage?: string;
  status: string;
  failureReason?: string;
}

export function logAuditEntry(entry: AuditEntry): boolean;
