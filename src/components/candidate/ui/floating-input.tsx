"use client";

import { FLOATING_INPUT, FLOATING_LABEL } from "@/lib/ui/classes";

export function FloatingInput({
  id,
  label,
  type = "text",
  defaultValue,
  disabled,
  required,
  placeholder = " ",
  name,
}: {
  id: string;
  label: string;
  type?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
  placeholder?: string;
  name?: string;
}) {
  return (
    <div className="relative">
      <input
        id={id}
        name={name ?? id}
        type={type}
        defaultValue={defaultValue}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        className={FLOATING_INPUT}
      />
      <label htmlFor={id} className={FLOATING_LABEL}>
        {label}
      </label>
    </div>
  );
}
