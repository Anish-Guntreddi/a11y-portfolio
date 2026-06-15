import type { Meta, StoryObj } from '@storybook/react';
import { Input } from './Input';
import { FormField } from '../FormField/FormField';

const meta: Meta<typeof Input> = {
  title: 'Components/Input',
  component: Input,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Accessible text input component.**

### A11y guarantees

- Renders a native \`<input>\` element — built-in keyboard and AT support.
- When placed inside \`<FormField>\`, the input automatically inherits:
  - \`id\` linked to the \`<label>\` via \`htmlFor\` (explicit label association).
  - \`aria-describedby\` pointing to description and/or error \`<p>\` elements.
  - \`aria-invalid="true"\` when a \`FormField\` \`error\` prop is set.
  - \`aria-required="true"\` when the \`FormField\` \`required\` prop is set.
- Focus ring via \`.nui-input:focus-visible\` (CSS rule, not a utility — cannot be removed by consumer className).
- Error state: red border via \`aria-[invalid=true]:border-danger\` (state-driven styling).
- Disabled state: sets the HTML \`disabled\` attribute plus reduces opacity.
        `,
      },
    },
  },
  argTypes: {
    placeholder: { control: 'text' },
    disabled: { control: 'boolean' },
    defaultValue: { control: 'text' },
  },
};

export default meta;
type Story = StoryObj<typeof Input>;

// ── Bare input (no FormField) ─────────────────────────────────────────────────

export const Default: Story = {
  args: {
    placeholder: 'Enter text…',
    'aria-label': 'Example input',
  },
};

export const WithValue: Story = {
  args: {
    defaultValue: 'Hello, world',
    'aria-label': 'Pre-filled input',
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    placeholder: 'Disabled input',
    'aria-label': 'Disabled input',
  },
};

// ── Inside FormField ──────────────────────────────────────────────────────────

export const WithLabel: Story = {
  render: () => (
    <FormField label="Email address">
      <Input placeholder="you@example.com" type="email" />
    </FormField>
  ),
};

export const WithDescription: Story = {
  render: () => (
    <FormField
      label="Username"
      description="Must be 3–20 characters, letters and numbers only."
    >
      <Input placeholder="jsmith" />
    </FormField>
  ),
};

export const Required: Story = {
  render: () => (
    <FormField label="Full name" required>
      <Input placeholder="Jane Smith" />
    </FormField>
  ),
};

export const WithError: Story = {
  render: () => (
    <FormField
      label="Email address"
      description="We will never share your email."
      error="Please enter a valid email address."
    >
      <Input type="email" defaultValue="not-an-email" />
    </FormField>
  ),
};

export const RequiredWithError: Story = {
  render: () => (
    <FormField label="Password" required error="Password must be at least 8 characters.">
      <Input type="password" defaultValue="abc" />
    </FormField>
  ),
};
