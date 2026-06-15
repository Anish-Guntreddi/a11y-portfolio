import { describe, expect, it } from 'vitest';
import { assertAuthorizedTarget } from './authorized-target.js';

describe('assertAuthorizedTarget', () => {
  describe('file: URLs', () => {
    it('allows file:///abs/path (empty host)', () => {
      expect(() =>
        assertAuthorizedTarget('file:///home/user/page.html'),
      ).not.toThrow();
    });

    it('allows file://localhost/abs/path', () => {
      expect(() =>
        assertAuthorizedTarget('file://localhost/abs/ok.html'),
      ).not.toThrow();
    });

    it('rejects file://evilhost/share/x.html (UNC/remote host)', () => {
      expect(() =>
        assertAuthorizedTarget('file://evilhost/share/x.html'),
      ).toThrow(/non-local host/);
    });

    it('rejects file://server/share/path (UNC path)', () => {
      expect(() =>
        assertAuthorizedTarget('file://server/share/path'),
      ).toThrow(/non-local host/);
    });

    it('returns the normalized URL for local file', () => {
      const result = assertAuthorizedTarget('file:///tmp/test.html');
      expect(result).toBe('file:///tmp/test.html');
    });
  });

  describe('loopback http/https', () => {
    it('allows localhost', () => {
      expect(() =>
        assertAuthorizedTarget('http://localhost:3000/page'),
      ).not.toThrow();
    });

    it('allows localhost with https', () => {
      expect(() =>
        assertAuthorizedTarget('https://localhost/'),
      ).not.toThrow();
    });

    it('allows 127.0.0.1', () => {
      expect(() =>
        assertAuthorizedTarget('http://127.0.0.1:8080/'),
      ).not.toThrow();
    });

    it('allows ::1', () => {
      expect(() =>
        assertAuthorizedTarget('http://[::1]:4000/'),
      ).not.toThrow();
    });

    // Robust loopback canonicalization (SHOULD-FIX 3)
    it('allows 127.1.2.3 (any 127.x.x.x is loopback)', () => {
      expect(() =>
        assertAuthorizedTarget('http://127.1.2.3/'),
      ).not.toThrow();
    });

    it('allows LOCALHOST (case-insensitive)', () => {
      expect(() =>
        assertAuthorizedTarget('http://LOCALHOST/'),
      ).not.toThrow();
    });

    it('allows localhost. (FQDN trailing dot)', () => {
      expect(() =>
        assertAuthorizedTarget('http://localhost./'),
      ).not.toThrow();
    });

    it('rejects 0.0.0.0 (not a loopback address)', () => {
      expect(() =>
        assertAuthorizedTarget('http://0.0.0.0/'),
      ).toThrow(/not authorized/);
    });
  });

  describe('remote URLs without authorization', () => {
    it('rejects example.com by default', () => {
      expect(() => assertAuthorizedTarget('https://example.com/')).toThrow(
        /not authorized/,
      );
    });

    it('rejects remote URL with only allowRemote: true', () => {
      expect(() =>
        assertAuthorizedTarget('https://example.com/', { allowRemote: true }),
      ).toThrow(/not authorized/);
    });

    it('rejects remote URL with only authorized: true', () => {
      expect(() =>
        assertAuthorizedTarget('https://example.com/', { authorized: true }),
      ).toThrow(/not authorized/);
    });
  });

  describe('remote URLs with explicit authorization', () => {
    it('allows example.com with allowRemote + authorized both true', () => {
      expect(() =>
        assertAuthorizedTarget('https://example.com/', {
          allowRemote: true,
          authorized: true,
        }),
      ).not.toThrow();
    });

    it('returns the URL when authorized', () => {
      const result = assertAuthorizedTarget('https://example.com/page', {
        allowRemote: true,
        authorized: true,
      });
      expect(result).toBe('https://example.com/page');
    });
  });

  describe('unsupported schemes', () => {
    it('rejects data: URLs', () => {
      expect(() =>
        assertAuthorizedTarget('data:text/html,<h1>test</h1>'),
      ).toThrow(/Unsupported URL scheme/);
    });

    it('rejects javascript: URLs', () => {
      expect(() =>
        assertAuthorizedTarget('javascript:alert(1)'),
      ).toThrow(/Unsupported URL scheme/);
    });

    it('rejects ftp: URLs', () => {
      expect(() => assertAuthorizedTarget('ftp://example.com/file')).toThrow(
        /Unsupported URL scheme/,
      );
    });
  });

  describe('invalid URLs', () => {
    it('rejects non-URL strings', () => {
      expect(() => assertAuthorizedTarget('not-a-url')).toThrow(/Invalid URL/);
    });
  });

  describe('post-redirect re-authorization (BLOCKER 2)', () => {
    // The driver calls assertAuthorizedTarget a second time with the final
    // post-redirect URL (page.url()). These tests verify that the gating logic
    // correctly rejects a disallowed origin even when the initial URL was
    // allowed (e.g. a localhost page that redirects to example.com).
    it('rejects a remote URL that would be the result of a redirect from a loopback host', () => {
      // Simulate: initial URL was http://localhost/..., page redirected to https://example.com/
      expect(() =>
        assertAuthorizedTarget('https://example.com/'),
      ).toThrow(/not authorized/);
    });

    it('rejects a remote URL redirect even when initial opts allowed loopback', () => {
      // With only loopback opts (default), a remote post-redirect URL must still throw
      expect(() =>
        assertAuthorizedTarget('https://evil.example.com/steal', {}),
      ).toThrow(/not authorized/);
    });

    it('accepts a remote post-redirect URL when allowRemote + authorized are set', () => {
      // If the user explicitly opted in, a redirect to a remote origin is fine
      expect(() =>
        assertAuthorizedTarget('https://example.com/', { allowRemote: true, authorized: true }),
      ).not.toThrow();
    });
  });
});
