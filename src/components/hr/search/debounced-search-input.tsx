"use client";

import { useEffect, useRef } from "react";
import { SEARCH_INPUT_CLASSNAME } from "@/lib/hr/search/constants";

type DebouncedSearchInputProps = {
  id: string;
  name: string;
  defaultValue?: string;
  placeholder?: string;
  debounceMs?: number;
};

/**
 * GET-form search input that debounces auto-submit so HR list pages
 * re-fetch on the server without requiring a Search button click.
 */
export function DebouncedSearchInput({
  id,
  name,
  defaultValue = "",
  placeholder,
  debounceMs = 400,
}: DebouncedSearchInputProps) {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  function handleChange(event: React.ChangeEvent<HTMLInputElement>) {
    const form = event.currentTarget.form;
    if (!form) {
      return;
    }

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      form.requestSubmit();
    }, debounceMs);
  }

  return (
    <input
      id={id}
      name={name}
      type="search"
      defaultValue={defaultValue}
      placeholder={placeholder}
      onChange={handleChange}
      className={SEARCH_INPUT_CLASSNAME}
    />
  );
}
