import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './Button';

const meta: Meta<typeof Button> = {
  title: 'Components/Button',
  component: Button,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Accessible Button component.**

### A11y guarantees

- Renders a native \`<button>\` element (never a \`<div>\` or \`<a>\`), ensuring built-in keyboard access and role semantics.
- Defaults \`type="button"\` to prevent accidental form submission.
- Visible focus ring via \`.nui-button:focus-visible\` — a dedicated CSS rule that cannot be overridden by consumer \`className\`.
- Keyboard: **Enter** and **Space** activate; **Tab** moves focus in/out.
- Disabled state: sets \`disabled\` attribute and \`pointer-events-none\` so the element is correctly inert for AT.
- All four variants maintain WCAG AA colour-contrast ratios (≥ 4.5:1 for normal text).
        `,
      },
    },
  },
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'ghost', 'danger'],
      description: 'Visual style variant',
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'Button size',
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the button (sets the HTML disabled attribute)',
    },
    children: {
      control: 'text',
      description: 'Button label',
    },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

// ── Variants ──────────────────────────────────────────────────────────────────

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary button',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary button',
  },
};

export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost button',
  },
};

export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger button',
  },
};

// ── Sizes ─────────────────────────────────────────────────────────────────────

export const Small: Story = {
  args: {
    size: 'sm',
    children: 'Small',
  },
};

export const Medium: Story = {
  args: {
    size: 'md',
    children: 'Medium',
  },
};

export const Large: Story = {
  args: {
    size: 'lg',
    children: 'Large',
  },
};

// ── Disabled ──────────────────────────────────────────────────────────────────

export const Disabled: Story = {
  args: {
    disabled: true,
    children: 'Disabled button',
  },
};

export const DisabledDanger: Story = {
  args: {
    variant: 'danger',
    disabled: true,
    children: 'Disabled danger',
  },
};

// ── All variants side-by-side ─────────────────────────────────────────────────

export const AllVariants: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button variant="primary">Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="ghost">Ghost</Button>
      <Button variant="danger">Danger</Button>
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
      <Button size="sm">Small</Button>
      <Button size="md">Medium</Button>
      <Button size="lg">Large</Button>
    </div>
  ),
};
