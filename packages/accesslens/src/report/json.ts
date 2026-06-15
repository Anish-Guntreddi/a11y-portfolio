import type { AuditResult } from '../types.js';

/** Serializes an AuditResult as pretty-printed JSON. */
export function renderJsonReport(result: AuditResult): string {
  return JSON.stringify(result, null, 2);
}
