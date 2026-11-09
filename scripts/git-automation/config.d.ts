export interface QualityGate {
  name: string;
  cmd: string;
  args: string[];
}

export interface ProjectGitConfig {
  slug: string;
  repoPath: string;
  expectedBranch: string;
  expectedRemote: string;
  expectedRemoteUrl: string;
  canCommitLocally: boolean;
  canPushRemotely: boolean;
  blockReason: string;
  mappingStatus: string;
  qualityGates: QualityGate[];
}

export const RepoMappingStatus: Record<string, string>;
export const ExecutionMode: Record<string, string>;
export const COMMIT_TYPES: readonly string[];
export const PROJECT_CONFIGS: Record<string, ProjectGitConfig>;
export function getProjectConfig(slug: string): ProjectGitConfig | null;
export function sanitizeRemoteUrl(url: string | null | undefined): string;
