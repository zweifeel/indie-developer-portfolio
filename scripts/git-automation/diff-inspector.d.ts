export interface DiffInspectionResult {
  valid: boolean;
  empty: boolean;
  stagedFiles: string[];
  violations: string[];
}

export function inspectStagedDiff(repoRoot: string, projectSlug?: string): DiffInspectionResult;
