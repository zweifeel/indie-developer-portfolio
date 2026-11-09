/**
 * ============================================================================
 * SLEEPYKOALA STUDIO — GIT AUTOMATION REPOSITORY CONFIGURATION (STAGE 3)
 * 
 * Strict Project Mapping, Quality Gates, and Fail-Closed Push Eligibility
 * ZERO CREDENTIALS STORED. All auth relies on native Git Credential Manager.
 * ============================================================================
 */

import path from 'node:path';

/**
 * Execution Modes
 */
export const ExecutionMode = {
  DRY_RUN: 'DRY-RUN',
  STATUS: 'STATUS',
  COMMIT: 'COMMIT',
  PUSH: 'PUSH',
};

export const DEFAULT_EXECUTION_MODE = ExecutionMode.DRY_RUN;

/**
 * Repository Mapping Status Codes
 */
export const RepoMappingStatus = {
  VERIFIED: 'VERIFIED',
  MISSING_GIT: 'MISSING_GIT',
  MISSING_REMOTE: 'MISSING_REMOTE',
  MISSING_UPSTREAM: 'MISSING_UPSTREAM',
  ACCOUNT_UNVERIFIED: 'ACCOUNT_UNVERIFIED',
  VISIBILITY_UNVERIFIED: 'VISIBILITY_UNVERIFIED',
  WRONG_ROOT: 'WRONG_ROOT',
  BLOCKED: 'BLOCKED',
};

/**
 * Project Repository Configuration
 */
export const PROJECT_CONFIGS = {
  'indie-developer-portfolio': {
    id: 'proj_website',
    slug: 'indie-developer-portfolio',
    name: 'SleepyKoala Studio Website',
    localRoot: 'E:\\Antigravity Project\\indie-developer-portfolio',
    expectedBranch: 'master',
    expectedRemote: null, // No remote configured on local repository
    expectedRemoteUrl: null,
    upstream: null,
    githubOwner: null,
    repoName: 'indie-developer-portfolio',
    visibility: 'VISIBILITY_UNVERIFIED',
    mappingStatus: RepoMappingStatus.MISSING_REMOTE,
    canCommitLocally: true,
    canPushRemotely: false,
    blockReason: 'Remote URL and private visibility not yet configured on repository.',
    qualityGates: [
      { name: 'Unit Tests', cmd: 'npm', args: ['test'] },
      { name: 'TypeScript Typecheck', cmd: 'npx', args: ['tsc', '-b'] },
      { name: 'Production Build', cmd: 'npm', args: ['run', 'build'] },
      { name: 'Linter', cmd: 'npm', args: ['run', 'lint'] },
      { name: 'File Policy Enforcer', cmd: 'node', args: ['scripts/check-file-policy.js'] },
      { name: 'Privacy & PII Scanner', cmd: 'node', args: ['scripts/privacy-scan.js'] },
      { name: 'Secret Scanner', cmd: 'node', args: ['scripts/security-scan.js'] },
    ],
  },

  'dompetnalar': {
    id: 'proj_dompetnalar',
    slug: 'dompetnalar',
    name: 'DompetNalar (FinSmart)',
    localRoot: 'E:\\Antigravity Project\\FinSmart',
    expectedBranch: 'main',
    expectedRemote: 'origin',
    expectedRemoteUrl: 'https://github.com/lunachroc07-dot/FinSmart.git',
    upstream: 'origin/main',
    githubOwner: 'lunachroc07-dot',
    repoName: 'FinSmart',
    visibility: 'VISIBILITY_UNVERIFIED',
    mappingStatus: RepoMappingStatus.VISIBILITY_UNVERIFIED,
    canCommitLocally: false, // Guarded against unintended batch commits of unrelated changes
    canPushRemotely: false,
    blockReason: 'Repository visibility is unverified (must be confirmed private by user).',
    qualityGates: [],
  },

  'idle-master': {
    id: 'proj_idlemaster',
    slug: 'idle-master',
    name: 'IDLE MASTER',
    localRoot: 'E:\\Antigravity Project\\Idle Master',
    expectedBranch: null,
    expectedRemote: null,
    expectedRemoteUrl: null,
    upstream: null,
    githubOwner: null,
    repoName: null,
    visibility: 'NOT_APPLICABLE',
    mappingStatus: RepoMappingStatus.MISSING_GIT,
    canCommitLocally: false,
    canPushRemotely: false,
    blockReason: 'Directory does not contain a Git repository (.git missing).',
    qualityGates: [],
  },

  'mobile-kasir': {
    id: 'proj_mobilekasir',
    slug: 'mobile-kasir',
    name: 'Mobile Kasir',
    localRoot: 'E:\\Antigravity Project\\mobile-kasir',
    expectedBranch: null,
    expectedRemote: null,
    expectedRemoteUrl: null,
    upstream: null,
    githubOwner: null,
    repoName: null,
    visibility: 'NOT_APPLICABLE',
    mappingStatus: RepoMappingStatus.MISSING_GIT,
    canCommitLocally: false,
    canPushRemotely: false,
    blockReason: 'Directory does not contain a Git repository (.git missing).',
    qualityGates: [],
  },

  'idle-mining': {
    id: 'proj_idlemining',
    slug: 'idle-mining',
    name: 'Idle Mining',
    localRoot: 'E:\\Antigravity Project\\Idle mining',
    expectedBranch: 'master',
    expectedRemote: null,
    expectedRemoteUrl: null,
    upstream: null,
    githubOwner: null,
    repoName: null,
    visibility: 'NOT_APPLICABLE',
    mappingStatus: RepoMappingStatus.MISSING_REMOTE,
    canCommitLocally: false,
    canPushRemotely: false,
    blockReason: 'Git repository has no remote configured (git remote -v is empty).',
    qualityGates: [],
  },

  'the-broken-origin': {
    id: 'proj_tbo',
    slug: 'the-broken-origin',
    name: 'The Broken Origin (TBO ROBLOX)',
    localRoot: 'E:\\Antigravity Project\\TBO ROBLOX',
    expectedBranch: 'feat/feat-066-memorystore-cache',
    expectedRemote: 'origin',
    expectedRemoteUrl: 'https://github.com/zweifeel/TBO-ROBLOX.git',
    upstream: 'origin/main',
    githubOwner: 'zweifeel',
    repoName: 'TBO-ROBLOX',
    visibility: 'PROTECTED_EXTERNAL',
    mappingStatus: RepoMappingStatus.BLOCKED,
    canCommitLocally: false,
    canPushRemotely: false,
    blockReason: 'Strict policy rule: Modification of TBO repository is prohibited.',
    qualityGates: [],
  },

  'worklume': {
    id: 'proj_worklume',
    slug: 'worklume',
    name: 'Worklume',
    localRoot: 'E:\\Antigravity Project\\Worklume',
    expectedBranch: null,
    expectedRemote: null,
    expectedRemoteUrl: null,
    upstream: null,
    githubOwner: null,
    repoName: null,
    visibility: 'NOT_APPLICABLE',
    mappingStatus: RepoMappingStatus.MISSING_GIT,
    canCommitLocally: false,
    canPushRemotely: false,
    blockReason: 'Directory does not contain a Git repository (.git missing).',
    qualityGates: [],
  },
};

/**
 * Valid Commit Types
 */
export const COMMIT_TYPES = [
  'feat',
  'fix',
  'refactor',
  'test',
  'docs',
  'build',
  'chore',
];

/**
 * Sanitizes URLs to mask any accidentally embedded tokens or passwords
 */
export function sanitizeRemoteUrl(url) {
  if (!url || typeof url !== 'string') return '';
  return url.replace(/(https?:\/\/)[^@]+@/i, '$1***@');
}

/**
 * Resolves project configuration by slug or path
 */
export function getProjectConfig(slugOrPath) {
  if (!slugOrPath) return null;
  const directMatch = PROJECT_CONFIGS[slugOrPath];
  if (directMatch) return directMatch;

  const normalized = path.resolve(slugOrPath).toLowerCase();
  for (const config of Object.values(PROJECT_CONFIGS)) {
    if (path.resolve(config.localRoot).toLowerCase() === normalized) {
      return config;
    }
  }

  return null;
}
