export interface FilePolicyResult {
  status: string;
  file: string;
  reason: string;
}

export interface RepositoryPolicyReport {
  totalChecked: number;
  allowed: FilePolicyResult[];
  fixtures: FilePolicyResult[];
  denied: FilePolicyResult[];
  unknown: FilePolicyResult[];
  success: boolean;
}

export const FileStatus: {
  ALLOWED_PROJECT_FILE: string;
  CONFIRMED_TEST_FIXTURE: string;
  DENIED_PROHIBITED_FILE: string;
  DENIED_SENSITIVE_DATA: string;
  UNKNOWN_ARTIFACT_REJECTED: string;
};

export function evaluateFilePolicy(filePath: string): FilePolicyResult;

export function checkRepositoryFilePolicy(rootDir?: string, options?: any): RepositoryPolicyReport;
