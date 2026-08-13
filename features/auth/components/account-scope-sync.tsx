"use client";

import { useEffect } from "react";
import { storageKeys } from "@/lib/storage/keys";

export function isAuthStorageEvent(key: string | null) {
  return key === storageKeys.auth;
}

/**
 * localStorage 기반 PoC 인증의 계정 전환을 다른 탭에도 즉시 반영합니다.
 * 페이지 로드는 폼·시트 같은 로컬 UI 상태까지 폐기해, 이전 계정 화면의
 * tripId로 새 계정 저장소에 쓰는 교차 계정 오염을 막습니다.
 */
export function AccountScopeSync() {
  useEffect(() => {
    function onStorage(event: StorageEvent) {
      if (!isAuthStorageEvent(event.key)) return;
      window.location.reload();
    }

    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  return null;
}
