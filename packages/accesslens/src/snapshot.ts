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

export interface TextNode {
  selector: string;
  text: string;
  color: string;
  /** Effective background color resolved by walking ancestors.
   *  Known limitation: this is a CSS approximation. It does not account for
   *  opacity inheritance, CSS blend modes, pseudo-elements, canvas backgrounds,
   *  or backgrounds set via JavaScript. Semi-transparent layers (alpha < 1) are
   *  skipped rather than composited. Falls back to rgb(255,255,255) (white) if
   *  no opaque ancestor background is found.
   */
  backgroundColor: string;
  fontSizePx: number;
  fontWeightNum: number;
}

export interface DomSnapshot {
  images: ImageNode[];
  headings: HeadingNode[];
  texts: TextNode[];
}

/**
 * Captures a DomSnapshot from the current page using page.evaluate.
 * Runs entirely in the browser context; requires computed styles for contrast.
 */
export async function captureSnapshot(page: Page): Promise<DomSnapshot> {
  return page.evaluate((): {
    images: ImageNode[];
    headings: HeadingNode[];
    texts: TextNode[];
  } => {
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
     * Walk ancestors to find the first element with an opaque background-color
     * (alpha > 0). Falls back to white if none found.
     * Known limitation: semi-transparent backgrounds are skipped, not composited.
     */
    function effectiveBackground(el: Element): string {
      let cur: Element | null = el;
      while (cur) {
        const bg = window.getComputedStyle(cur).backgroundColor;
        // bg is e.g. "rgba(0,0,0,0)" or "rgb(255,255,255)"
        const match = bg.match(/rgba?\(\s*(\d+),\s*(\d+),\s*(\d+)(?:,\s*([\d.]+))?\s*\)/);
        if (match) {
          const alpha = match[4] !== undefined ? parseFloat(match[4]) : 1;
          if (alpha > 0) return bg;
        }
        cur = cur.parentElement;
      }
      return 'rgb(255,255,255)';
    }

    // ---------- images ----------

    const images: ImageNode[] = Array.from(document.querySelectorAll('img')).map((img) => ({
      selector: stableSelector(img),
      hasAltAttr: img.hasAttribute('alt'),
      alt: img.getAttribute('alt'),
      role: img.getAttribute('role'),
      ariaHidden: isAriaHidden(img),
    }));

    // ---------- headings ----------

    const headingEls = Array.from(
      document.querySelectorAll('h1, h2, h3, h4, h5, h6'),
    ) as HTMLElement[];

    const headings: HeadingNode[] = headingEls.map((h) => ({
      level: parseInt(h.tagName[1], 10) as 1 | 2 | 3 | 4 | 5 | 6,
      text: (h.textContent ?? '').trim(),
      selector: stableSelector(h),
    }));

    // ---------- texts ----------

    const textNodes: TextNode[] = [];
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

    return { images, headings, texts: textNodes };
  });
}
