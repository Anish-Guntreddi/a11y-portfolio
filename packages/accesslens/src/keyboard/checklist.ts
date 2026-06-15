import type { DomSnapshot } from '../snapshot.js';
import type { ChecklistItem, KeyboardChecklist } from '../types.js';

export type { ChecklistItem, KeyboardChecklist };

export function buildKeyboardChecklist(snapshot: DomSnapshot): ChecklistItem[] {
  const interactiveElements = snapshot.interactiveElements ?? [];
  const ariaElements = snapshot.ariaElements ?? [];

  // 1. no-positive-tabindex: no tabindex > 0
  const positiveTabindex = [
    ...interactiveElements.filter((el) => el.tabindex !== null && el.tabindex > 0),
    ...ariaElements.filter((el) => el.tabindex !== null && el.tabindex > 0),
  ];
  // Deduplicate by selector
  const positiveSelectors = [...new Set(positiveTabindex.map((el) => el.selector))];

  const noPositiveTabindex: ChecklistItem =
    positiveSelectors.length === 0
      ? {
          id: 'no-positive-tabindex',
          title: 'No positive tabindex values',
          status: 'pass',
          details: 'No elements with tabindex > 0 were found.',
        }
      : {
          id: 'no-positive-tabindex',
          title: 'No positive tabindex values',
          status: 'fail',
          details: `Elements with positive tabindex disrupt natural tab order: ${positiveSelectors.join(', ')}`,
        };

  // 2. interactive-focusable: no interactive element with tabindex === -1
  const unfocusable = interactiveElements.filter((el) => el.tabindex === -1);
  const unfocusableSelectors = unfocusable.map((el) => el.selector);

  const interactiveFocusable: ChecklistItem =
    unfocusableSelectors.length === 0
      ? {
          id: 'interactive-focusable',
          title: 'All interactive elements are keyboard-focusable',
          status: 'pass',
          details: 'No interactive elements were found with tabindex="-1".',
        }
      : {
          id: 'interactive-focusable',
          title: 'All interactive elements are keyboard-focusable',
          status: 'fail',
          details: `Interactive elements made unfocusable via tabindex="-1": ${unfocusableSelectors.join(', ')}`,
        };

  // 3. skip-link
  const skipLinkItem: ChecklistItem = snapshot.skipLink
    ? {
        id: 'skip-link',
        title: 'Skip-to-content link present',
        status: 'pass',
        details: 'A skip link targeting an existing anchor was found among the first focusable elements.',
      }
    : {
        id: 'skip-link',
        title: 'Skip-to-content link present',
        status: 'fail',
        details:
          'Add a skip-to-content link as the first focusable element to allow keyboard users to skip repeated navigation.',
      };

  // 4. focus-visible: always manual
  const focusVisible: ChecklistItem = {
    id: 'focus-visible',
    title: 'Focus indicators are visible',
    status: 'manual',
    details:
      'Manually verify that every interactive element shows a clearly visible focus indicator when navigated to with the Tab key. Check buttons, links, inputs, and custom controls.',
  };

  // 5. no-keyboard-trap: always manual
  const noKeyboardTrap: ChecklistItem = {
    id: 'no-keyboard-trap',
    title: 'No keyboard traps',
    status: 'manual',
    details:
      'Manually verify that keyboard focus can always move away from every component. Tab and Shift+Tab must not become trapped in any widget (unless it is a modal dialog that intentionally constrains focus).',
  };

  return [noPositiveTabindex, interactiveFocusable, skipLinkItem, focusVisible, noKeyboardTrap];
}
