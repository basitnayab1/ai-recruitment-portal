"use client";

import { useSyncExternalStore } from "react";

/** True only after the client has mounted — use to gate browser-only UI. */
export function useHasMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false
  );
}
