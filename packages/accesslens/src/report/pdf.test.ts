import { describe, expect, it } from 'vitest';
import { renderPdfReport } from './pdf.js';
import type { AuditResult } from '../types.js';
import { existsSync, readFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

function makeSampleResult(): AuditResult {
  return {
    url: 'file:///test/sample.html',
    timestampIso: '2026-06-15T00:00:00.000Z',
    findings: [
      {
        ruleId: 'image-alt',
        severity: 'critical',
        message: 'Image missing alt.',
        remediation: 'Add alt attribute.',
        targets: ['img'],
        source: 'axe',
      },
    ],
    summary: { critical: 1, serious: 0, moderate: 0, minor: 0, total: 1 },
    keyboardChecklist: [],
  };
}

describe('renderPdfReport', () => {
  it('writes a non-empty PDF file starting with %PDF magic bytes', async () => {
    const outPath = join(tmpdir(), `accesslens-test-${Date.now()}.pdf`);
    try {
      await renderPdfReport(makeSampleResult(), outPath);
      expect(existsSync(outPath)).toBe(true);
      const buf = readFileSync(outPath);
      expect(buf.length).toBeGreaterThan(0);
      // PDF magic bytes: %PDF
      expect(buf.subarray(0, 4).toString('ascii')).toBe('%PDF');
    } finally {
      if (existsSync(outPath)) unlinkSync(outPath);
    }
  }, 30_000);
});
