"use client";

import { useCallback, useEffect, useRef } from "react";

export const UNSAVED_NAVIGATION_REQUEST_EVENT =
  "tripdito:unsaved-navigation-request";

export type PendingUnsavedNavigation =
  | {
      kind: "href";
      href: string;
      discardAll: true;
    }
  | {
      kind: "history-back";
      discardAll: true;
    }
  | {
      kind: "callback";
      onConfirm: () => void;
      discardAll: boolean;
    };

declare global {
  interface Window {
    __tripditoUnsavedGuards?: Set<string>;
    __tripditoAllowPopstate?: boolean;
    __tripditoRestoreThenPrompt?: boolean;
    __tripditoPendingNavigation?: PendingUnsavedNavigation;
  }
}

export function hasUnsavedPageChanges() {
  if (typeof window === "undefined") return false;

  return Boolean(
    window.__tripditoUnsavedGuards?.size ||
      document.querySelector('form[data-unsaved="true"]'),
  );
}

export function clearUnsavedPageChanges() {
  window.__tripditoUnsavedGuards?.clear();
}

function queueNavigationRequest(request: PendingUnsavedNavigation) {
  if (window.__tripditoPendingNavigation) return;

  window.__tripditoPendingNavigation = request;
  window.dispatchEvent(new Event(UNSAVED_NAVIGATION_REQUEST_EVENT));
}

/**
 * Requests an in-app confirmation before a programmatic route change.
 * Link clicks and browser Back are intercepted by the root navigation guard.
 */
export function requestPageNavigation(onConfirm: () => void) {
  if (!hasUnsavedPageChanges()) {
    onConfirm();
    return;
  }

  queueNavigationRequest({
    kind: "callback",
    onConfirm,
    discardAll: true,
  });
}

export function useUnsavedChanges(isDirty: boolean) {
  const markerRef = useRef<string | null>(null);

  useEffect(() => {
    if (!isDirty) return;

    const marker = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    markerRef.current = marker;
    const guards = (window.__tripditoUnsavedGuards ??= new Set<string>());
    guards.add(marker);

    const handleBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!window.__tripditoUnsavedGuards?.has(marker)) return;
      event.preventDefault();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.__tripditoUnsavedGuards?.delete(marker);
      if (markerRef.current === marker) markerRef.current = null;
    };
  }, [isDirty]);

  return useCallback(
    (onDiscard: () => void) => {
      if (!isDirty) {
        onDiscard();
        return;
      }

      queueNavigationRequest({
        kind: "callback",
        onConfirm: onDiscard,
        discardAll: false,
      });
    },
    [isDirty],
  );
}
