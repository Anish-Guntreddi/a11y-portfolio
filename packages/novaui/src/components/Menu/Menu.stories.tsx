import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Menu } from './Menu';
import type { MenuItem } from './Menu';

const meta: Meta<typeof Menu> = {
  title: 'Components/Menu',
  component: Menu,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Accessible Menu Button — WAI-ARIA APG "Menu Button" pattern.**

### A11y guarantees

- Trigger is a native \`<button>\` with \`aria-haspopup="menu"\`, \`aria-expanded\`, and \`aria-controls\` pointing to the menu list id.
- Menu list has \`role="menu"\` with \`aria-labelledby\` pointing back to the trigger.
- Each item wrapper has \`role="none"\`; the button inside has \`role="menuitem"\`.
- Disabled items have \`aria-disabled="true"\` (not the HTML \`disabled\` attribute, so they remain in the accessibility tree but are skipped by keyboard navigation).
- **Keyboard — trigger**:
  - \`Enter\` / \`Space\` / \`ArrowDown\`: open + focus first enabled item.
  - \`ArrowUp\`: open + focus last enabled item.
- **Keyboard — menu**:
  - \`ArrowDown\` / \`ArrowUp\`: navigate items (wrap-around, skips disabled).
  - \`Home\` / \`End\`: jump to first / last enabled item.
  - \`Enter\` / \`Space\`: activate focused item; close; return focus to trigger.
  - \`Escape\`: close; return focus to trigger.
  - \`Tab\`: close (focus proceeds naturally — not trapped in the menu).
- Outside click closes the menu (no focus return).
- Roving tabindex: only the currently focused item has \`tabIndex=0\`; others have \`tabIndex=-1\`.
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Text rendered inside the trigger button' },
  },
};

export default meta;
type Story = StoryObj<typeof Menu>;

// ── Base items list ───────────────────────────────────────────────────────────

const baseItems: MenuItem[] = [
  { id: 'profile', label: 'My profile', onSelect: () => {} },
  { id: 'settings', label: 'Settings', onSelect: () => {} },
  { id: 'help', label: 'Help & support', onSelect: () => {} },
  { id: 'logout', label: 'Sign out', onSelect: () => {} },
];

const itemsWithDisabled: MenuItem[] = [
  { id: 'profile', label: 'My profile', onSelect: () => {} },
  { id: 'settings', label: 'Settings', onSelect: () => {} },
  { id: 'admin', label: 'Admin panel', onSelect: () => {}, disabled: true },
  { id: 'help', label: 'Help & support', onSelect: () => {} },
  { id: 'logout', label: 'Sign out', onSelect: () => {} },
];

// ── Stories ───────────────────────────────────────────────────────────────────

export const Default: Story = {
  args: {
    label: 'Options',
    items: baseItems,
  },
};

export const WithDisabledItem: Story = {
  args: {
    label: 'Account',
    items: itemsWithDisabled,
  },
};

// ── Interactive story showing the selected item ───────────────────────────────

function MenuWithFeedback() {
  const [selected, setSelected] = useState<string | null>(null);
  const items: MenuItem[] = [
    { id: 'new', label: 'New file', onSelect: () => setSelected('New file') },
    { id: 'open', label: 'Open…', onSelect: () => setSelected('Open…') },
    { id: 'save', label: 'Save', onSelect: () => setSelected('Save') },
    { id: 'export', label: 'Export (unavailable)', onSelect: () => setSelected('Export'), disabled: true },
    { id: 'close', label: 'Close', onSelect: () => setSelected('Close') },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Menu label="File" items={items} />
      {selected && (
        <p style={{ margin: 0 }}>
          Selected: <strong>{selected}</strong>
        </p>
      )}
    </div>
  );
}

export const Interactive: Story = {
  render: () => <MenuWithFeedback />,
};
