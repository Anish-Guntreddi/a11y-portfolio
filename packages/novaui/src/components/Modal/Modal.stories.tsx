import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react';
import { Modal } from './Modal';
import { Button } from '../Button/Button';

const meta: Meta<typeof Modal> = {
  title: 'Components/Modal',
  component: Modal,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**Accessible modal dialog.**

### A11y guarantees

- Renders a \`role="dialog"\` with \`aria-modal="true"\`, \`aria-labelledby\` (title id), and \`aria-describedby\` (description id when present).
- **Focus trap**: when the dialog opens, focus moves into the dialog and is constrained to its focusable descendants. Focus cannot escape to background content via keyboard.
- **Background inert**: all sibling body children receive \`inert\` + \`aria-hidden="true"\` while the dialog is open, preventing screen-reader and keyboard access to background content.
- **Focus restoration**: on close, focus returns to the element that triggered the dialog open.
- **Keyboard**: \`Escape\` closes; \`Tab\` / \`Shift+Tab\` cycle within the dialog.
- **Body scroll lock**: \`overflow: hidden\` applied to \`body\` while open.
- **Backdrop click**: optional (default enabled) — pointer-down on the backdrop closes the dialog.
- Rendered via \`createPortal\` to \`document.body\` to escape stacking contexts.

> **Note on focus trap in Storybook**: Storybook's addon panel and toolbar are in a parent frame; the focus trap only applies inside the story canvas iframe, so keyboard navigation within the story is correctly constrained.
        `,
      },
    },
  },
  argTypes: {
    title: { control: 'text' },
    description: { control: 'text' },
    closeOnBackdropClick: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Modal>;

// ── Interactive story (trigger button opens/closes modal) ─────────────────────

function ModalWithTrigger(props: { description?: string; closeOnBackdropClick?: boolean }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button onClick={() => setOpen(true)}>Open modal</Button>
      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="Example dialog"
        description={props.description}
        closeOnBackdropClick={props.closeOnBackdropClick}
      >
        <p style={{ margin: 0 }}>
          This is the dialog body. Press <kbd>Escape</kbd>, click the close button, or click
          the backdrop to close.
        </p>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
          <Button variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={() => setOpen(false)}>Confirm</Button>
        </div>
      </Modal>
    </>
  );
}

export const Default: Story = {
  render: () => <ModalWithTrigger />,
};

export const WithDescription: Story = {
  render: () => (
    <ModalWithTrigger description="Review the details below before confirming." />
  ),
};

export const BackdropClickDisabled: Story = {
  render: () => (
    <ModalWithTrigger
      description="This dialog will not close when you click the backdrop."
      closeOnBackdropClick={false}
    />
  ),
};
