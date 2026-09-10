"use client";

import { useEffect, useState, type RefObject } from "react";

/**
 * 요소가 화면 근처(rootMargin 만큼 확장한 영역)에 들어왔는지.
 * 한 번 true 가 되면 유지한다 — 스크롤로 벗어나도 이미 받은 이미지를 버리지 않기 위해서.
 */
export function useNearViewport(
  ref: RefObject<Element | null>,
  {
    rootMargin = "0px",
    initial = false,
  }: { rootMargin?: string; initial?: boolean } = {},
) {
  const [near, setNear] = useState(initial);

  useEffect(() => {
    if (near) return;
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setNear(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, rootMargin, near]);

  return near;
}
