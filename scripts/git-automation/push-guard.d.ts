export interface PushOptions {
  projectSlug: string;
  dryRun?: boolean;
}

export interface PushResult {
  success: boolean;
  pushed: boolean;
  dryRun?: boolean;
  mappingStatus?: string;
  targetRemote?: string;
  sanitizedUrl?: string;
  targetBranch?: string;
  upstream?: string;
  message?: string;
  error?: string;
}

export function executePush(repoRoot: string, options: PushOptions): PushResult;
