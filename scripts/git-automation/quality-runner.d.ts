export interface QualityGateResult {
  name: string;
  cmd: string;
  args: string[];
  passed: boolean;
  output?: string;
  error?: string;
}

export interface QualityRunSummary {
  allPassed: boolean;
  results: QualityGateResult[];
}

export function runQualityGates(projectSlug: string, cwdOverride?: string): QualityRunSummary;
