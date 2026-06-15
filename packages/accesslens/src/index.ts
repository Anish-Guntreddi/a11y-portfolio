export type { Severity, Finding, AuditSummary, AuditResult } from './types.js';
export { summarize, makeResult } from './types.js';
export { assertAuthorizedTarget } from './security/authorized-target.js';
export { auditUrl } from './audit.js';
export { runAxe } from './runners/axe.js';
