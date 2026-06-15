import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import type { Page } from 'playwright';
import type { Finding, Severity } from '../types.js';

const require = createRequire(import.meta.url);

function resolveAxeSource(): string {
  const axePath: string = require.resolve('axe-core');
  return readFileSync(axePath, 'utf8');
}

/** Maps axe-core impact values to our Severity type. */
function mapImpact(impact: string | null | undefined): Severity {
  switch (impact) {
    case 'critical':
      return 'critical';
    case 'serious':
      return 'serious';
    case 'moderate':
      return 'moderate';
    case 'minor':
      return 'minor';
    default:
      return 'moderate';
  }
}

interface AxeNodeResult {
  target: (string | string[])[];
  html?: string;
}

interface AxeViolation {
  id: string;
  impact: string | null;
  help: string;
  description: string;
  helpUrl: string;
  nodes: AxeNodeResult[];
}

interface AxeResults {
  violations: AxeViolation[];
}

const HTML_SNIPPET_MAX = 512;

/** Truncates an html snippet to HTML_SNIPPET_MAX chars to bound report size. */
function truncateHtml(html: string | undefined): string | undefined {
  if (html === undefined) return undefined;
  return html.length > HTML_SNIPPET_MAX ? html.slice(0, HTML_SNIPPET_MAX) + '…' : html;
}

/** Maps a single axe violation to our Finding model. */
export function mapViolation(v: AxeViolation): Finding {
  const severity = mapImpact(v.impact);
  const targets = v.nodes.flatMap((n) =>
    n.target.map((t) => (Array.isArray(t) ? t.join(' ') : t)),
  );
  const html = truncateHtml(v.nodes[0]?.html);

  return {
    ruleId: v.id,
    severity,
    message: v.help,
    remediation: v.description,
    targets,
    helpUrl: v.helpUrl,
    html,
    source: 'axe',
  };
}

/**
 * Validates that the value returned by page.evaluate looks like an axe result.
 * Throws a clear error if the shape is wrong (e.g. CSP blocked script injection).
 *
 * Exported for unit testing only.
 */
export function assertAxeResultShape(value: unknown): asserts value is AxeResults {
  if (
    value === null ||
    typeof value !== 'object' ||
    !Array.isArray((value as Record<string, unknown>)['violations'])
  ) {
    throw new Error(
      'axe-core did not return a valid result object. ' +
        'The page may have a Content Security Policy that blocked script injection. ' +
        `Received: ${JSON.stringify(value)}`,
    );
  }
}

/**
 * Injects axe-core into the page, runs axe.run(), and returns mapped Findings.
 * Throws if the axe result shape is invalid (e.g. CSP blocked injection).
 */
export async function runAxe(page: Page): Promise<Finding[]> {
  const axeSource = resolveAxeSource();
  await page.addScriptTag({ content: axeSource });

  const results = await page.evaluate(() => {
    // axe.run() with no context argument defaults to document
    return (window as unknown as { axe: { run: () => Promise<unknown> } }).axe.run();
  });

  assertAxeResultShape(results);

  return results.violations.map(mapViolation);
}
