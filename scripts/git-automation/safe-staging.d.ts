export interface StagingResult {
  success: boolean;
  dryRun: boolean;
  stagedFiles: string[];
  rejectedFiles: Array<{ file: string; reason: string; code: string }>;
  error?: string;
}

export function stageFilesSafely(
  repoRoot: string,
  targetFiles?: string[],
  options?: { dryRun?: boolean; projectSlug?: string }
): StagingResult;
