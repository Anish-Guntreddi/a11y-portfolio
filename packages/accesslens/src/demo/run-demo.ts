/**
 * Demo script: audits the bundled bad.html and good.html fixtures and writes
 * sample reports under examples/ at the package root.
 *
 * Run with:  pnpm --filter @a11y-portfolio/accesslens demo
 */
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { auditUrl } from '../audit.js';
import { renderHtmlReport } from '../report/html.js';
import { renderJsonReport } from '../report/json.js';
import { renderPdfReport } from '../report/pdf.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Resolve from src/demo/ → ../../ (package root) → examples/
const pkgRoot = resolve(__dirname, '..', '..');
const examplesDir = resolve(pkgRoot, 'examples');
const fixturesDir = resolve(pkgRoot, 'src', 'fixtures');

mkdirSync(examplesDir, { recursive: true });

async function run(): Promise<void> {
  console.log('AccessLens Demo — auditing fixtures…\n');

  // --- bad.html ---
  const badUrl = `file://${resolve(fixturesDir, 'bad.html')}`;
  console.log(`Auditing: ${badUrl}`);
  const badResult = await auditUrl(badUrl);
  console.log(`  → ${badResult.summary.total} finding(s) (critical:${badResult.summary.critical} serious:${badResult.summary.serious} moderate:${badResult.summary.moderate} minor:${badResult.summary.minor})`);

  writeFileSync(resolve(examplesDir, 'bad-report.html'), renderHtmlReport(badResult), 'utf-8');
  console.log('  → examples/bad-report.html written');

  writeFileSync(resolve(examplesDir, 'bad-report.json'), renderJsonReport(badResult), 'utf-8');
  console.log('  → examples/bad-report.json written');

  const badPdfPath = resolve(examplesDir, 'bad-report.pdf');
  await renderPdfReport(badResult, badPdfPath);
  console.log('  → examples/bad-report.pdf written');

  // --- good.html ---
  const goodUrl = `file://${resolve(fixturesDir, 'good.html')}`;
  console.log(`\nAuditing: ${goodUrl}`);
  const goodResult = await auditUrl(goodUrl);
  console.log(`  → ${goodResult.summary.total} finding(s)`);

  writeFileSync(resolve(examplesDir, 'good-report.html'), renderHtmlReport(goodResult), 'utf-8');
  console.log('  → examples/good-report.html written');

  console.log('\nDemo complete.');
}

run().catch((err) => {
  console.error('Demo failed:', err);
  process.exit(1);
});
