import { chromium, type Browser, type Page } from 'playwright';
import { assertAuthorizedTarget, type AuthorizedTargetOpts } from './security/authorized-target.js';

export interface LoadPageResult {
  browser: Browser;
  page: Page;
  /** The final URL after all redirects, already re-authorized. */
  finalUrl: string;
}

export type WithPageOpts = AuthorizedTargetOpts;

/**
 * Launches a headless Chromium browser, opens a page, and navigates to `url`.
 * After navigation, re-authorizes the final (post-redirect) URL so a redirect
 * to a disallowed origin is caught before any runner executes.
 * The caller is responsible for closing the browser.
 */
export async function loadPage(
  url: string,
  opts: WithPageOpts = {},
): Promise<LoadPageResult> {
  const normalizedUrl = assertAuthorizedTarget(url, opts);

  const launchArgs: string[] = [];
  // --no-sandbox is only added in CI (where the user-namespace sandbox is unavailable).
  // PLAYWRIGHT_NO_SANDBOX=1 is an unsafe local escape hatch — document it clearly and
  // never set it in production or untrusted environments.
  if (process.env['CI'] === 'true' || process.env['PLAYWRIGHT_NO_SANDBOX'] === '1') {
    launchArgs.push('--no-sandbox', '--disable-setuid-sandbox');
  }

  const browser = await chromium.launch({ headless: true, args: launchArgs });
  try {
    const page = await browser.newPage();
    await page.goto(normalizedUrl, { waitUntil: 'load' });

    // Re-authorize the final URL to catch redirects to disallowed origins.
    const finalUrl = assertAuthorizedTarget(page.url(), opts);

    return { browser, page, finalUrl };
  } catch (err) {
    await browser.close();
    throw err;
  }
}

/**
 * Higher-level helper: loads the page, runs `fn(page, finalUrl)`, then always
 * closes the browser.  `finalUrl` is the post-redirect URL, already re-authorized.
 */
export async function withPage<T>(
  url: string,
  opts: WithPageOpts,
  fn: (page: Page, finalUrl: string) => Promise<T>,
): Promise<T> {
  const { browser, page, finalUrl } = await loadPage(url, opts);
  try {
    return await fn(page, finalUrl);
  } finally {
    await browser.close();
  }
}
