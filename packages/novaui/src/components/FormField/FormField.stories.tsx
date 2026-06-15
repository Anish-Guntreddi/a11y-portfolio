import type { Meta, StoryObj } from '@storybook/react';
import { FormField } from './FormField';
import { Input } from '../Input/Input';

const meta: Meta<typeof FormField> = {
  title: 'Components/FormField',
  component: FormField,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**FormField — accessible label/description/error wrapper for a single form control.**

### A11y guarantees

- Uses \`useId()\` to generate stable, unique ids for the field, description, and error elements.
- The \`<label>\` is associated to the control via \`htmlFor\` (explicit label association — not aria-label).
- Description text is wrapped in a \`<p>\` with an \`id\` and wired to the control via \`aria-describedby\`.
- Error text is wrapped in a \`<p role="alert">\` (live region — announces immediately to screen readers) with an \`id\` also wired into \`aria-describedby\`.
- When both description and error are present, \`aria-describedby\` contains both ids (space-joined).
- The \`required\` prop: renders a visually-hidden-friendly \`<span aria-hidden="true"> *</span>\` next to the label, and sets \`aria-required="true"\` on the control via context.
- Only one control may be placed inside a \`FormField\` (enforced by single-id contract).
        `,
      },
    },
  },
  argTypes: {
    label: { control: 'text', description: 'Visible label text for the control' },
    description: { control: 'text', description: 'Helper text rendered above the control' },
    error: { control: 'text', description: 'Error message; also sets aria-invalid on the control' },
    required: { control: 'boolean', description: 'Marks the field as required' },
  },
};

export default meta;
type Story = StoryObj<typeof FormField>;

export const Basic: Story = {
  args: {
    label: 'Display name',
  },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="Enter your name" />
    </FormField>
  ),
};

export const WithDescription: Story = {
  args: {
    label: 'Email address',
    description: 'We will never share your email with anyone.',
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="email" placeholder="you@example.com" />
    </FormField>
  ),
};

export const WithError: Story = {
  args: {
    label: 'Email address',
    error: 'Please enter a valid email address.',
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="email" defaultValue="not-an-email" />
    </FormField>
  ),
};

export const Required: Story = {
  args: {
    label: 'Full name',
    required: true,
  },
  render: (args) => (
    <FormField {...args}>
      <Input placeholder="Jane Smith" />
    </FormField>
  ),
};

export const RequiredWithDescriptionAndError: Story = {
  args: {
    label: 'Password',
    description: 'Must be at least 8 characters, with a number and a symbol.',
    error: 'Password is too short.',
    required: true,
  },
  render: (args) => (
    <FormField {...args}>
      <Input type="password" defaultValue="abc" />
    </FormField>
  ),
};
