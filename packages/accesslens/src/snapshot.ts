import type { Page } from 'playwright';

export interface ImageNode {
  selector: string;
  hasAltAttr: boolean;
  alt: string | null;
  role: string | null;
  ariaHidden: boolean;
}

export interface HeadingNode {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  text: string;
  selector: string;
}

/**
 * Sentinel value in TextNode.backgroundColor indicating the effective background
 * could not be determined (e.g. ancestor has background-image / gradient).
 * The contrast rule MUST skip nodes with this value.
 */
export const UNRESOLVED_BACKGROUND = '__unresolved__';

export interface TextNode {
  selector: string;
  text: string;
  color: string;
  /**
   * Effective background color resolved by walking ancestors via alpha
   * compositing (Porter-Duff "over"). Falls back to rgb(255,255,255) (white,
   * the browser canvas default) when no opaque ancestor is found but no
   * background-image is encountered.
   *
   * Set to the UNRESOLVED_BACKGROUND sentinel when an ancestor has a
   * background-image / gradient — callers must skip such nodes rather than
   * computing a possibly-wrong contrast ratio.
   */
  backgroundColor: string;
  fontSizePx: number;
  fontWeightNum: number;
}

export interface LandmarkNode {
  role: string;
  tag: string;
  accessibleName: string | null;
  selector: string;
}

export interface AriaNode {
  selector: string;
  role: string | null;
  ariaHidden: boolean;
  focusable: boolean;
  tabindex: number | null;
  invalidRole: boolean;
}

export interface InteractiveNode {
  selector: string;
  tag: string;
  tabindex: number | null;
  role: string | null;
  accessibleName: string | null;
}

export interface DomSnapshot {
  images: ImageNode[];
  headings: HeadingNode[];
  texts: TextNode[];
  landmarks?: LandmarkNode[];
  ariaElements?: AriaNode[];
  interactiveElements?: InteractiveNode[];
  skipLink?: boolean;
}

/**
 * Captures a DomSnapshot from the current page using page.evaluate.
 * Runs entirely in the browser context; requires computed styles for contrast.
 */
export async function captureSnapshot(page: Page): Promise<DomSnapshot> {
  return page.evaluate((): DomSnapshot => {
    // ---------- helpers ----------

    function stableSelector(el: Element): string {
      // Build a nth-of-type path from body down to el.
      const parts: string[] = [];
      let node: Element | null = el;
      while (node && node !== document.body && node.parentElement) {
        const tag = node.tagName.toLowerCase();
        const siblings = Array.from(node.parentElement.children).filter(
          (c) => c.tagName.toLowerCase() === tag,
        );
        const idx = siblings.indexOf(node) + 1;
        parts.unshift(siblings.length === 1 ? tag : `${tag}:nth-of-type(${idx})`);
        node = node.parentElement;
      }
      return parts.length ? 'body > ' + parts.join(' > ') : el.tagName.toLowerCase();
    }

    function isAriaHidden(el: Element): boolean {
      let cur: Element | null = el;
      while (cur) {
        if (cur.getAttribute('aria-hidden') === 'true') return true;
        cur = cur.parentElement;
      }
      return false;
    }

    /**
     * Sentinel string used to signal that the background cannot be resolved
     * (e.g. because an ancestor has a background-image / gradient).
     * The contrast rule MUST skip nodes that carry this value.
     */
    const UNRESOLVED_BG = '__unresolved__';

    /**
     * Composite a foreground RGBA over a background RGBA using Porter-Duff "over".
     * Returns accumulated { r, g, b, a } with channels 0–255.
     */
    function compositeOver(
      fg: { r: number; g: number; b: number; a: number },
      bg: { r: number; g: number; b: number; a: number },
    ): { r: number; g: number; b: number; a: number } {
      const a = fg.a + bg.a * (1 - fg.a);
      if (a === 0) return { r: 0, g: 0, b: 0, a: 0 };
      const r = (fg.r * fg.a + bg.r * bg.a * (1 - fg.a)) / a;
      const g = (fg.g * fg.a + bg.g * bg.a * (1 - fg.a)) / a;
      const b = (fg.b * fg.a + bg.b * bg.a * (1 - fg.a)) / a;
      return { r, g, b, a };
    }

    /**
     * Parse "rgb(r,g,b)" / "rgba(r,g,b,a)" / CSS Color-4 space-separated form
     * into { r, g, b, a }. Returns null for fully-transparent or unparseable.
     */
    function parseBgColor(
      css: string,
    ): { r: number; g: number; b: number; a: number } | null {
      // Legacy comma: rgb(r,g,b) / rgba(r,g,b,a)
      let m = css.match(/^rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)$/);
      if (m) {
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10), a };
      }
      // Modern space-separated: rgb(r g b) / rgb(r g b / a)
      m = css.match(/^rgba?\(\s*(\d+)\s+(\d+)\s+(\d+)(?:\s*\/\s*([\d.]+))?\s*\)$/);
      if (m) {
        const a = m[4] !== undefined ? parseFloat(m[4]) : 1;
        return { r: parseInt(m[1], 10), g: parseInt(m[2], 10), b: parseInt(m[3], 10), a };
      }
      return null;
    }

    /**
     * Walk ancestors to compute the effective background colour for contrast
     * checks. Composites semi-transparent layers using Porter-Duff "over".
     *
     * Returns:
     *   - An opaque "rgb(r,g,b)" string when fully resolved.
     *   - UNRESOLVED_BG when an ancestor has a background-image (gradient /
     *     url / …) — the contrast rule must skip such nodes.
     *   - Falls back to "rgb(255,255,255)" (browser canvas default) when the
     *     root is reached with no opaque colour encountered but also no
     *     background-image, preserving detection of text on default-white canvas.
     */
    function effectiveBackground(el: Element): string {
      // Accumulated composite; starts fully transparent.
      let composite: { r: number; g: number; b: number; a: number } = { r: 0, g: 0, b: 0, a: 0 };

      let cur: Element | null = el;
      while (cur) {
        const style = window.getComputedStyle(cur);

        // If an ancestor has a background-image (gradient/url), we cannot
        // determine the effective colour — mark as unresolved.
        const bgImage = style.backgroundImage;
        if (bgImage && bgImage !== 'none') {
          return UNRESOLVED_BG;
        }

        const bgColor = style.backgroundColor;
        const parsed = parseBgColor(bgColor);

        if (parsed !== null && parsed.a > 0) {
          // Composite the current layer under our accumulated foreground
          composite = compositeOver(composite, parsed);
          if (composite.a >= 0.99) {
            // Fully opaque — no need to walk further
            const r = Math.round(composite.r);
            const g = Math.round(composite.g);
            const b = Math.round(composite.b);
            return `rgb(${r},${g},${b})`;
          }
        }

        cur = cur.parentElement;
      }

      // Reached root without a fully opaque result.
      // Composite whatever we have over the browser canvas default (white).
      const white = { r: 255, g: 255, b: 255, a: 1 };
      const final = compositeOver(composite, white);
      const r = Math.round(final.r);
      const g = Math.round(final.g);
      const b = Math.round(final.b);
      return `rgb(${r},${g},${b})`;
    }

    function getAccessibleName(el: Element): string | null {
      const label = el.getAttribute('aria-label');
      if (label && label.trim()) return label.trim();
      const labelledBy = el.getAttribute('aria-labelledby');
      if (labelledBy) {
        const text = labelledBy
          .split(/\s+/)
          .map((id) => document.getElementById(id)?.textContent?.trim() ?? '')
          .join(' ')
          .trim();
        if (text) return text;
      }
      return null;
    }

    // ---------- images ----------
    // Covers <img>, <input type="image">, and <area> — all require alt text.

    const imageEls = Array.from(
      document.querySelectorAll('img, input[type="image"], area'),
    );
    const images = imageEls.map((el) => ({
      selector: stableSelector(el),
      hasAltAttr: el.hasAttribute('alt'),
      alt: el.getAttribute('alt'),
      role: el.getAttribute('role'),
      ariaHidden: isAriaHidden(el),
    }));

    // ---------- headings ----------

    // Collect native h1–h6 elements.
    const nativeHeadingEls = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
    ) as HTMLElement[];

    // Collect elements with role="heading" and a valid aria-level (1–6)
    // that are NOT already native heading elements.
    const ariaHeadingEls = Array.from(
      document.querySelectorAll('[role="heading"]'),
    ).filter((el) => {
      // Skip elements that are already native headings (h1–h6)
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) return false;
      const levelAttr = el.getAttribute('aria-level');
      if (levelAttr === null) return false;
      const level = parseInt(levelAttr, 10);
      return level >= 1 && level <= 6;
    }) as HTMLElement[];

    // Merge all heading elements in document order
    const allHeadingEls = Array.from(document.querySelectorAll(
      'h1, h2, h3, h4, h5, h6, [role="heading"]',
    )).filter((el) => {
      const tag = el.tagName.toLowerCase();
      if (/^h[1-6]$/.test(tag)) return true;
      // ARIA heading: must have valid aria-level
      const levelAttr = el.getAttribute('aria-level');
      if (levelAttr === null) return false;
      const level = parseInt(levelAttr, 10);
      return level >= 1 && level <= 6;
    }) as HTMLElement[];

    // Suppress unused variables for the separate arrays (merged via allHeadingEls)
    void nativeHeadingEls;
    void ariaHeadingEls;

    const headings = allHeadingEls.map((h) => {
      const tag = h.tagName.toLowerCase();
      let level: number;
      if (/^h[1-6]$/.test(tag)) {
        level = parseInt(tag[1], 10);
      } else {
        // role="heading" with aria-level
        level = parseInt(h.getAttribute('aria-level')!, 10);
      }
      return {
        level: level as 1 | 2 | 3 | 4 | 5 | 6,
        text: (h.textContent ?? '').trim(),
        selector: stableSelector(h),
      };
    });

    // ---------- texts ----------

    const textNodes: {
      selector: string;
      text: string;
      color: string;
      backgroundColor: string;
      fontSizePx: number;
      fontWeightNum: number;
    }[] = [];
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const seen = new Set<Element>();

    let textNode: Text | null;
    while ((textNode = walker.nextNode() as Text | null)) {
      const parent = textNode.parentElement;
      if (!parent || seen.has(parent)) continue;
      const text = (textNode.nodeValue ?? '').trim();
      if (!text) continue;

      seen.add(parent);

      const style = window.getComputedStyle(parent);
      const rawWeight = style.fontWeight;
      let fontWeightNum = parseFloat(rawWeight);
      if (isNaN(fontWeightNum)) {
        fontWeightNum = rawWeight === 'bold' ? 700 : 400;
      }

      textNodes.push({
        selector: stableSelector(parent),
        text,
        color: style.color,
        backgroundColor: effectiveBackground(parent),
        fontSizePx: parseFloat(style.fontSize),
        fontWeightNum,
      });
    }

    // ---------- landmarks ----------

    const LANDMARK_ROLES = new Set([
      'banner', 'complementary', 'contentinfo', 'form', 'main',
      'navigation', 'region', 'search',
    ]);

    // Tags that make <header>/<footer> NOT top-level landmark
    const SECTIONING_CONTENT = new Set(['article', 'aside', 'main', 'nav', 'section']);

    function isTopLevel(el: Element): boolean {
      let parent = el.parentElement;
      while (parent && parent !== document.documentElement) {
        if (SECTIONING_CONTENT.has(parent.tagName.toLowerCase())) return false;
        parent = parent.parentElement;
      }
      return true;
    }

    const landmarks: {
      role: string;
      tag: string;
      accessibleName: string | null;
      selector: string;
    }[] = [];

    // Collect implicit landmarks from semantic HTML
    for (const el of Array.from(document.querySelectorAll(
      'header, nav, main, footer, aside, section, form, [role]',
    ))) {
      const tag = el.tagName.toLowerCase();
      const explicitRole = el.getAttribute('role');

      // Handle elements with explicit landmark role
      if (explicitRole && LANDMARK_ROLES.has(explicitRole)) {
        landmarks.push({
          role: explicitRole,
          tag,
          accessibleName: getAccessibleName(el),
          selector: stableSelector(el),
        });
        continue;
      }

      // Skip if element already handled by explicit role above
      if (explicitRole) continue;

      let role: string | null = null;

      if (tag === 'header' && isTopLevel(el)) {
        role = 'banner';
      } else if (tag === 'nav') {
        role = 'navigation';
      } else if (tag === 'main') {
        role = 'main';
      } else if (tag === 'footer' && isTopLevel(el)) {
        role = 'contentinfo';
      } else if (tag === 'aside') {
        role = 'complementary';
      } else if (tag === 'section') {
        const name = getAccessibleName(el);
        if (name) role = 'region';
      } else if (tag === 'form') {
        const name = getAccessibleName(el);
        if (name) role = 'form';
      }

      if (role) {
        landmarks.push({
          role,
          tag,
          accessibleName: getAccessibleName(el),
          selector: stableSelector(el),
        });
      }
    }

    // ---------- ariaElements ----------

    const VALID_ARIA_ROLES = new Set([
      'alert', 'alertdialog', 'application', 'article', 'banner', 'blockquote', 'button',
      'caption', 'cell', 'checkbox', 'code', 'columnheader', 'combobox', 'complementary',
      'contentinfo', 'definition', 'deletion', 'dialog', 'directory', 'document',
      'emphasis', 'feed', 'figure', 'form', 'generic', 'grid', 'gridcell', 'group',
      'heading', 'img', 'insertion', 'link', 'list', 'listbox', 'listitem', 'log',
      'main', 'marquee', 'math', 'meter', 'menu', 'menubar', 'menuitem', 'menuitemcheckbox',
      'menuitemradio', 'navigation', 'none', 'note', 'option', 'paragraph', 'presentation',
      'progressbar', 'radio', 'radiogroup', 'region', 'row', 'rowgroup', 'rowheader',
      'scrollbar', 'search', 'searchbox', 'separator', 'slider', 'spinbutton', 'status',
      'strong', 'subscript', 'superscript', 'switch', 'tab', 'table', 'tablist', 'tabpanel',
      'term', 'textbox', 'time', 'timer', 'toolbar', 'tooltip', 'tree', 'treegrid', 'treeitem',
    ]);

    const NATURALLY_FOCUSABLE = new Set(['a', 'button', 'input', 'select', 'textarea']);

    function isFocusable(el: Element): boolean {
      const tag = el.tagName.toLowerCase();
      const tabindexAttr = el.getAttribute('tabindex');
      if (tabindexAttr !== null) {
        return parseInt(tabindexAttr, 10) >= 0;
      }
      if (tag === 'a') return el.hasAttribute('href');
      return NATURALLY_FOCUSABLE.has(tag);
    }

    // Elements with a role attribute or any aria-* attribute
    const ariaElements: {
      selector: string;
      role: string | null;
      ariaHidden: boolean;
      focusable: boolean;
      tabindex: number | null;
      invalidRole: boolean;
    }[] = [];

    for (const el of Array.from(document.querySelectorAll('*'))) {
      const hasRole = el.hasAttribute('role');
      const hasAria = Array.from(el.attributes).some((a) => a.name.startsWith('aria-'));
      if (!hasRole && !hasAria) continue;

      const role = el.getAttribute('role');
      const tabindexAttr = el.getAttribute('tabindex');
      const tabindex = tabindexAttr !== null ? parseInt(tabindexAttr, 10) : null;
      const focusable = isFocusable(el);
      const invalidRole = hasRole && role !== null && !VALID_ARIA_ROLES.has(role);

      ariaElements.push({
        selector: stableSelector(el),
        role,
        ariaHidden: isAriaHidden(el),
        focusable,
        tabindex,
        invalidRole,
      });
    }

    // ---------- interactiveElements ----------

    const INTERACTIVE_ROLES = new Set([
      'button', 'link', 'menuitem', 'menuitemcheckbox', 'menuitemradio',
      'option', 'treeitem', 'tab', 'switch', 'checkbox', 'radio',
      'combobox', 'spinbutton', 'slider', 'searchbox', 'textbox',
    ]);

    const interactiveElements: {
      selector: string;
      tag: string;
      tabindex: number | null;
      role: string | null;
      accessibleName: string | null;
    }[] = [];

    const interactiveSelector =
      'a[href], button, input, select, textarea, [role="button"], [role="link"], ' +
      '[role="menuitem"], [role="menuitemcheckbox"], [role="menuitemradio"], ' +
      '[role="option"], [role="treeitem"], [role="tab"], [role="switch"], ' +
      '[role="checkbox"], [role="radio"], [role="combobox"], [role="spinbutton"], ' +
      '[role="slider"], [role="searchbox"], [role="textbox"]';

    for (const el of Array.from(document.querySelectorAll(interactiveSelector))) {
      const tag = el.tagName.toLowerCase();
      const role = el.getAttribute('role');
      const tabindexAttr = el.getAttribute('tabindex');
      const tabindex = tabindexAttr !== null ? parseInt(tabindexAttr, 10) : null;

      // Get accessible name: aria-label, aria-labelledby, or text content
      let accessibleName = getAccessibleName(el);
      if (!accessibleName) {
        const text = (el.textContent ?? '').trim();
        if (text) accessibleName = text;
      }

      interactiveElements.push({
        selector: stableSelector(el),
        tag,
        tabindex,
        role: role ?? (INTERACTIVE_ROLES.has(tag) ? tag : null),
        accessibleName: accessibleName ?? null,
      });
    }

    // ---------- skipLink ----------

    const focusableCandidates = Array.from(
      document.querySelectorAll('a[href], button, input, [tabindex]'),
    ).filter((el) => {
      const tabindex = el.getAttribute('tabindex');
      if (tabindex !== null) return parseInt(tabindex, 10) >= 0;
      return true;
    });

    let skipLink = false;
    const first3 = focusableCandidates.slice(0, 3);
    for (const el of first3) {
      const href = el.getAttribute('href') ?? '';
      if (href.startsWith('#')) {
        const targetId = href.slice(1);
        if (targetId && document.getElementById(targetId)) {
          skipLink = true;
          break;
        }
      }
    }

    return { images, headings, texts: textNodes, landmarks, ariaElements, interactiveElements, skipLink };
  });
}
