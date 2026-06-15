import React, { createContext, useContext, useId } from 'react';

// ── Context ───────────────────────────────────────────────────────────────────

export interface FormFieldContextValue {
  fieldId: string;
  descriptionId: string;
  errorId: string;
  /** Space-joined ids of description/error elements that are present. */
  describedBy: string | undefined;
  invalid: boolean;
  required: boolean;
}

export const FormFieldContext = createContext<FormFieldContextValue | null>(null);

export function useFormField(): FormFieldContextValue | null {
  return useContext(FormFieldContext);
}

// ── Props ─────────────────────────────────────────────────────────────────────

export interface FormFieldProps {
  label: string;
  description?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}

// ── Component ─────────────────────────────────────────────────────────────────

/**
 * FormField wires exactly ONE labelled control to a shared label, description, and
 * error message. Rendering multiple `<Input>` elements inside a single FormField is
 * unsupported — they would all receive the same `id` (fieldId), duplicating the
 * controlled-element relationship and breaking label association.
 */
// One-control contract: fieldId is assigned to a single child control only.
export function FormField({ label, description, error, required = false, children }: FormFieldProps) {
  const base = useId();
  const fieldId = `${base}-field`;
  const descriptionId = `${base}-description`;
  const errorId = `${base}-error`;

  const ids: string[] = [];
  if (description) ids.push(descriptionId);
  if (error) ids.push(errorId);
  const describedBy = ids.length > 0 ? ids.join(' ') : undefined;

  const ctx: FormFieldContextValue = {
    fieldId,
    descriptionId,
    errorId,
    describedBy,
    invalid: Boolean(error),
    required,
  };

  return (
    <FormFieldContext.Provider value={ctx}>
      <div>
        <label htmlFor={fieldId}>
          {label}
          {required && (
            <span aria-hidden="true"> *</span>
          )}
        </label>
        {description && (
          <p id={descriptionId}>{description}</p>
        )}
        {children}
        {error && (
          <p id={errorId} role="alert">
            {error}
          </p>
        )}
      </div>
    </FormFieldContext.Provider>
  );
}
