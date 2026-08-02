"use client";

import {
  FIELD_INPUT,
  SELECT_INPUT,
} from "@/lib/ui/classes";

type CommonProps = {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
  disabled?: boolean;
};

/** Search text input — does not navigate on change. */
export function FilterSearchInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  className = FIELD_INPUT,
  disabled,
}: CommonProps & { placeholder?: string }) {
  return (
    <input
      id={id}
      name={name}
      type="search"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
      autoComplete="off"
    />
  );
}

/** Select — does not navigate on change; parent form submits on Apply. */
export function FilterSelect({
  id,
  name,
  defaultValue = "",
  children,
  className = SELECT_INPUT,
  disabled,
}: CommonProps & { children: React.ReactNode }) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      className={className}
      disabled={disabled}
    >
      {children}
    </select>
  );
}

/** Date input — does not navigate on change. */
export function FilterDateInput({
  id,
  name,
  defaultValue = "",
  className = FIELD_INPUT,
  disabled,
}: CommonProps) {
  return (
    <input
      id={id}
      name={name}
      type="date"
      defaultValue={defaultValue}
      className={className}
      disabled={disabled}
    />
  );
}

/** Number input — does not navigate on change. */
export function FilterNumberInput({
  id,
  name,
  defaultValue = "",
  min,
  placeholder,
  className = FIELD_INPUT,
  disabled,
}: CommonProps & { min?: number; placeholder?: string }) {
  return (
    <input
      id={id}
      name={name}
      type="number"
      min={min}
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={className}
      disabled={disabled}
    />
  );
}
