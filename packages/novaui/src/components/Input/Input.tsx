import React, { forwardRef } from 'react';
import { clsx } from 'clsx';
import { useFormField } from '../FormField/FormField';
import './Input.css';

function cn(...classes: Parameters<typeof clsx>): string {
  return clsx(...classes);
}

// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const BASE =
  'nui-input ' +
  'block w-full rounded-md border border-border bg-surface px-3 py-2 text-sm text-fg ' +
  'placeholder:text-muted-fg ' +
  'transition-colors ' +
  'disabled:pointer-events-none disabled:opacity-50 ' +
  'aria-[invalid=true]:border-danger';

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  {
    id,
    'aria-describedby': ariaDescribedBy,
    'aria-invalid': ariaInvalid,
    'aria-required': ariaRequired,
    className,
    ...props
  },
  ref,
) {
  const field = useFormField();

  // When inside a FormField:
  // - id: prefer consumer-supplied id; otherwise use context fieldId.
  //   NOTE: overriding id inside FormField is discouraged — the label's htmlFor
  //   will then point to fieldId, not the consumer id, breaking the association.
  // - aria-describedby: MERGE context ids with consumer-supplied ids (space-join,
  //   deduplicated, empties dropped). Consumer ids are never silently dropped.
  // - aria-invalid / aria-required: explicit consumer value wins over context.
  let resolvedId: string | undefined;
  let resolvedDescribedBy: string | undefined;
  let resolvedInvalid: React.AriaAttributes['aria-invalid'];
  let resolvedRequired: React.AriaAttributes['aria-required'];

  if (field) {
    resolvedId = id ?? field.fieldId;

    const contextIds = field.describedBy ? field.describedBy.split(/\s+/) : [];
    const consumerIds = ariaDescribedBy ? ariaDescribedBy.split(/\s+/) : [];
    const merged = Array.from(new Set([...contextIds, ...consumerIds])).filter(Boolean);
    resolvedDescribedBy = merged.length > 0 ? merged.join(' ') : undefined;

    resolvedInvalid = ariaInvalid ?? (field.invalid || undefined);
    resolvedRequired = ariaRequired ?? (field.required || undefined);
  } else {
    resolvedId = id;
    resolvedDescribedBy = ariaDescribedBy;
    resolvedInvalid = ariaInvalid;
    resolvedRequired = ariaRequired;
  }

  return (
    <input
      ref={ref}
      id={resolvedId}
      aria-describedby={resolvedDescribedBy}
      aria-invalid={resolvedInvalid}
      aria-required={resolvedRequired}
      className={cn(BASE, className)}
      {...props}
    />
  );
});
