import { chromium } from 'playwright';
import type { AuditResult } from '../types.js';
import { renderHtmlReport } from './html.js';

/**
 * Renders an AuditResult as a PDF file at `outPath`.
 * Internally renders the HTML report and prints it via Playwright Chromium.
 * Always closes the browser even if an error occurs.
 */
export async function renderPdfReport(result: AuditResult, outPath: string): Promise<void> {
  const html = renderHtmlReport(result);

  const launchArgs: string[] = [];
  if (process.env['CI'] === 'true' || process.env['PLAYWRIGHT_NO_SANDBOX'] === '1') {
    launchArgs.push('--no-sandbox', '--disable-setuid-sandbox');
  }

  const browser = await chromium.launch({ headless: true, args: launchArgs });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'load' });
    await page.pdf({ path: outPath, format: 'A4', printBackground: true });
  } finally {
    await browser.close();
  }
}
