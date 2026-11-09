export type ProjectCategory = 'GAME' | 'APPLICATION';

export type ProjectStatus =
  | 'READY_FOR_RELEASE'
  | 'RELEASED'
  | 'PRE_REGISTRATION'
  | 'CLOSED_TESTING'
  | 'INTERNAL_TESTING'
  | 'WORK_IN_PROGRESS'
  | 'COMING_SOON';

export interface ProjectCapability {
  readonly title: string;
  readonly description: string;
  readonly icon: string;
}

export interface Project {
  readonly id: string;
  readonly slug: string;
  readonly name: string;
  readonly category: ProjectCategory;
  readonly status: ProjectStatus;
  readonly shortDescription: string;
  readonly fullDescription: string;
  readonly tagline?: string;
  readonly icon: string;
  readonly screenshots: readonly string[];
  readonly version: string;
  readonly lastUpdated: string;
  readonly playStoreUrl?: string;
  readonly testingUrl?: string;
  readonly registrationOpen: boolean;
  readonly testerRequirementDays?: number;
  readonly featured: boolean;
  readonly tags?: readonly string[];
  readonly technicalHighlights?: readonly string[];
  readonly capabilities?: readonly ProjectCapability[];
  readonly vision?: string;
}

export type ReportType = 'BUG_REPORT' | 'FEEDBACK' | 'FEATURE_SUGGESTION';

export interface FeedbackFormValues {
  testerName: string;
  testerEmail: string;
  reportType: ReportType;
  appVersion: string;
  deviceModel: string;
  androidVersion: string;
  description: string;
  honeypot?: string;
}

export interface RegistrationFormValues {
  testerName: string;
  testerEmail: string;
  honeypot?: string;
}

export interface ProjectStatistics {
  readonly totalProjects: number;
  readonly readyForReleaseProjects: number;
  readonly releasedProjects: number;
  readonly closedTestingProjects: number;
  readonly workInProgressProjects: number;
  readonly totalGames: number;
  readonly totalApplications: number;
  readonly activeRecruitmentCount: number;
}
