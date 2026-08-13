"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ConfirmDialog } from "@/components/common/confirm-dialog";
import {
  clearUnsavedPageChanges,
  type PendingUnsavedNavigation,
  UNSAVED_NAVIGATION_REQUEST_EVENT,
} from "@/lib/navigation/unsaved-changes";

export function UnsavedNavigationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [request, setRequest] = useState<PendingUnsavedNavigation | null>(null);

  const receiveRequest = useCallback(() => {
    const pending = window.__tripditoPendingNavigation;
    if (pending) setRequest(pending);
  }, []);

  useEffect(() => {
    window.addEventListener(
      UNSAVED_NAVIGATION_REQUEST_EVENT,
      receiveRequest,
    );
    const pendingRequestTimer = window.setTimeout(receiveRequest, 0);

    return () => {
      window.clearTimeout(pendingRequestTimer);
      window.removeEventListener(
        UNSAVED_NAVIGATION_REQUEST_EVENT,
        receiveRequest,
      );
    };
  }, [receiveRequest]);

  function cancelNavigation() {
    window.__tripditoPendingNavigation = undefined;
    setRequest(null);
  }

  function confirmNavigation() {
    if (!request) return;

    const confirmedRequest = request;
    window.__tripditoPendingNavigation = undefined;
    if (confirmedRequest.discardAll) clearUnsavedPageChanges();
    setRequest(null);

    window.setTimeout(() => {
      if (confirmedRequest.kind === "href") {
        const next = new URL(confirmedRequest.href, window.location.href);
        if (next.origin !== window.location.origin) return;
        router.push(`${next.pathname}${next.search}${next.hash}`);
        return;
      }

      if (confirmedRequest.kind === "history-back") {
        window.__tripditoAllowPopstate = true;
        router.back();
        return;
      }

      confirmedRequest.onConfirm();
    }, 0);
  }

  return (
    <>
      {children}
      <ConfirmDialog
        open={Boolean(request)}
        onOpenChange={(open) => {
          if (!open) cancelNavigation();
        }}
        title="작성 중인 내용을 버릴까요?"
        description="저장하지 않은 내용은 사라져요. 계속 이동하시겠어요?"
        confirmLabel="버리고 이동"
        cancelLabel="계속 작성"
        confirmVariant="destructive"
        onConfirm={confirmNavigation}
      />
    </>
  );
}
