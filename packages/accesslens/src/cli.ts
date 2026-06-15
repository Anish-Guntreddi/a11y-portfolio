#!/usr/bin/env node

import { parseArgs } from 'node:util';
import { writeFileSync } from 'node:fs';
import { auditUrl } from './audit.js';
import { renderHtmlReport } from './report/html.js';
import { renderJsonReport } from './report/json.js';
import { renderPdfReport } from './report/pdf.js';
import type { Severity } from './types.js';

const USAGE = `Usage: accesslens <url> [options]

Options:
  --format html|pdf|json   Output format (default: html)
  --out <file>             Write output to file (required for --format pdf)
  --no-custom-rules        Skip custom accessibility rules
  --allow-remote           Allow auditing non-loopback URLs (requires --i-am-authorized)
  --i-am-authorized        Confirm you are authorized to scan the target
  --fail-on <severity>     Exit 1 if any finding at or above severity exists
                           Severities: critical, serious, moderate, minor
                           Use "none" to always exit 0 (default: exit 1 when total > 0)
  --help                   Show this usage text and exit

Examples:
  accesslens file:///path/to/page.html
  accesslens http://localhost:3000 --format json --out report.json
  accesslens https://example.com --allow-remote --i-am-authorized --format html --out report.html
  accesslens http://localhost:3000 --fail-on serious
`;

const SEVERITY_RANK: Record<Severity, number> = {
  critical: 4,
  serious: 3,
  moderate: 2,
  minor: 1,
};

function die(msg: string, code = 1): never {
  process.stderr.write(`accesslens: ${msg}\n`);
  process.exit(code);
}

async function main(): Promise<void> {
  let parsed: ReturnType<typeof parseArgs>;
  try {
    parsed = parseArgs({
      args: process.argv.slice(2),
      options: {
        format: { type: 'string', default: 'html' },
        out: { type: 'string' },
        'no-custom-rules': { type: 'boolean', default: false },
        'allow-remote': { type: 'boolean', default: false },
        'i-am-authorized': { type: 'boolean', default: false },
        'fail-on': { type: 'string' },
        help: { type: 'boolean', default: false },
      },
      allowPositionals: true,
    });
  } catch (err) {
    die(String(err));
  }

  if (parsed.values.help) {
    process.stdout.write(USAGE);
    process.exit(0);
  }

  const positionals = parsed.positionals;
  if (positionals.length === 0) {
    process.stderr.write(USAGE);
    die('A URL argument is required.');
  }

  const url = positionals[0]!;
  const format = parsed.values.format as string;
  const outFile = parsed.values.out as string | undefined;
  const customRules = !(parsed.values['no-custom-rules'] as boolean);
  const allowRemote = parsed.values['allow-remote'] as boolean;
  const authorized = parsed.values['i-am-authorized'] as boolean;
  const failOnRaw = parsed.values['fail-on'] as string | undefined;

  if (!['html', 'pdf', 'json'].includes(format)) {
    die(`Unknown format "${format}". Choose html, pdf, or json.`);
  }

  if (format === 'pdf' && !outFile) {
    die('--format pdf requires --out <file>.');
  }

  let result;
  try {
    result = await auditUrl(url, { allowRemote, authorized, customRules });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    // Distinguish authorization errors (exit 2)
    if (msg.includes('not authorized') || msg.includes('not authorized') || msg.includes('allowRemote') || msg.includes('authorized')) {
      die(`Authorization error: ${msg}`, 2);
    }
    die(`Audit failed: ${msg}`);
  }

  // Determine exit code based on --fail-on
  let shouldFail = result.summary.total > 0;
  if (failOnRaw !== undefined) {
    if (failOnRaw === 'none') {
      shouldFail = false;
    } else {
      const thresholdRank = SEVERITY_RANK[failOnRaw as Severity];
      if (thresholdRank === undefined) {
        die(`Unknown severity "${failOnRaw}". Choose critical, serious, moderate, minor, or none.`);
      }
      shouldFail = result.findings.some((f) => SEVERITY_RANK[f.severity] >= thresholdRank);
    }
  }

  if (format === 'json') {
    const output = renderJsonReport(result);
    if (outFile) {
      writeFileSync(outFile, output, 'utf-8');
    } else {
      process.stdout.write(output + '\n');
    }
  } else if (format === 'html') {
    const output = renderHtmlReport(result);
    if (outFile) {
      writeFileSync(outFile, output, 'utf-8');
    } else {
      process.stdout.write(output + '\n');
    }
  } else if (format === 'pdf') {
    // outFile is guaranteed non-null here (checked above)
    await renderPdfReport(result, outFile!);
  }

  process.exit(shouldFail ? 1 : 0);
}

main().catch((err: unknown) => {
  process.stderr.write(`accesslens: Unexpected error: ${String(err)}\n`);
  process.exit(1);
});
