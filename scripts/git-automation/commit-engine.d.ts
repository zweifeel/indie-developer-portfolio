export interface CommitOptions {
  projectSlug: string;
  type: string;
  summary: string;
  body?: string;
  dryRun?: boolean;
}

export interface CommitResult {
  success: boolean;
  dryRun?: boolean;
  commitHash?: string;
  commitMessage?: string;
  plannedCommitMessage?: string;
  error?: string;
}

export function executeCommit(repoRoot: string, options: CommitOptions): CommitResult;
