export interface DetectedChanges {
  isGitRepo: boolean;
  hasChanges: boolean;
  modified: string[];
  added: string[];
  deleted: string[];
  renamed: string[];
  untracked: string[];
  buildArtifacts: string[];
  tempFiles: string[];
  allStagable: string[];
  error?: string;
}

export function detectChanges(repoRoot: string): DetectedChanges;
