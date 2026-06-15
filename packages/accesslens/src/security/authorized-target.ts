export interface AuthorizedTargetOpts {
  allowRemote?: boolean;
  authorized?: boolean;
}

/**
 * Canonicalizes a hostname for loopback checks:
 *   - lowercase
 *   - strip a single trailing dot (FQDN form)
 */
function canonicalizeHost(host: string): string {
  const lower = host.toLowerCase();
  return lower.endsWith('.') ? lower.slice(0, -1) : lower;
}

/**
 * Returns true for hosts that are loopback addresses:
 *   - 'localhost'
 *   - any 127.x.x.x IPv4 address (127.0.0.0/8)
 *   - IPv6 loopback '::1' or '[::1]'
 *   - IPv4-mapped IPv6 loopback '::ffff:127.x.x.x'
 *
 * Note: 0.0.0.0 is NOT loopback and will return false.
 */
function isLoopback(host: string): boolean {
  const h = canonicalizeHost(host);
  if (h === 'localhost') return true;
  // IPv6: URL parser strips brackets, so hostname is '::1'; host field keeps them
  if (h === '::1' || h === '[::1]') return true;
  // IPv4 127.0.0.0/8
  if (/^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  // IPv4-mapped IPv6 loopback e.g. ::ffff:127.0.0.1
  if (/^::ffff:127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(h)) return true;
  return false;
}

/**
 * Asserts that `rawUrl` is an authorized scan target.
 *
 * Rules:
 *   - file: URLs are allowed only when the host is empty (file:///abs/path)
 *     or exactly 'localhost' (file://localhost/abs/path). UNC/remote file
 *     hosts (file://server/...) are rejected unconditionally.
 *   - http/https with a loopback hostname are always allowed.
 *   - Any other http/https origin requires opts.allowRemote === true AND opts.authorized === true.
 *   - All other schemes (data:, javascript:, etc.) are rejected unconditionally.
 *
 * Returns the normalized URL string on success, throws on rejection.
 */
export function assertAuthorizedTarget(
  rawUrl: string,
  opts: AuthorizedTargetOpts = {},
): string {
  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    throw new Error(`Invalid URL: "${rawUrl}"`);
  }

  const scheme = parsed.protocol; // includes trailing colon e.g. "https:"

  if (scheme === 'file:') {
    // parsed.hostname is the host portion of file://host/path.
    // For file:///abs/path the host is empty string.
    // For file://localhost/abs/path the host is 'localhost'.
    // For file://server/share/x.html the host is 'server' — reject.
    const fileHost = parsed.hostname; // already lowercase from URL parser
    if (fileHost === '' || fileHost === 'localhost') {
      return parsed.href;
    }
    throw new Error(
      `file: URL "${rawUrl}" specifies a non-local host "${fileHost}". ` +
        'Only file:///abs/path or file://localhost/abs/path are allowed.',
    );
  }

  if (scheme === 'http:' || scheme === 'https:') {
    if (isLoopback(parsed.hostname)) {
      return parsed.href;
    }
    if (opts.allowRemote === true && opts.authorized === true) {
      return parsed.href;
    }
    throw new Error(
      `Remote URL "${rawUrl}" is not authorized. ` +
        'Pass allowRemote: true and authorized: true to scan non-loopback origins ' +
        '(equivalent to --allow-remote --i-am-authorized on the CLI).',
    );
  }

  throw new Error(
    `Unsupported URL scheme "${scheme}" in "${rawUrl}". ` +
      'Only file:, http:, and https: URLs are supported.',
  );
}
