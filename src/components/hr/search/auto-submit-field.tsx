"use client";

import { SELECT_INPUT_CLASSNAME } from "@/lib/hr/search/constants";

type AutoSubmitSelectProps = {
  id: string;
  name: string;
  defaultValue?: string;
  children: React.ReactNode;
  className?: string;
};

type AutoSubmitDateInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  className?: string;
};

function submitParentForm(event: React.SyntheticEvent<HTMLInputElement | HTMLSelectElement>) {
  event.currentTarget.form?.requestSubmit();
}

/** Select that auto-submits its parent GET form on change. */
export function AutoSubmitSelect({
  id,
  name,
  defaultValue = "",
  children,
  className = SELECT_INPUT_CLASSNAME,
}: AutoSubmitSelectProps) {
  return (
    <select
      id={id}
      name={name}
      defaultValue={defaultValue}
      onChange={submitParentForm}
      className={className}
    >
      {children}
    </select>
  );
}

/** Date input that auto-submits its parent GET form on change. */
export function AutoSubmitDateInput({
  id,
  name,
  defaultValue = "",
  className = SELECT_INPUT_CLASSNAME,
}: AutoSubmitDateInputProps) {
  return (
    <input
      id={id}
      name={name}
      type="date"
      defaultValue={defaultValue}
      onChange={submitParentForm}
      className={className}
    />
  );
}
