"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "@/components/common/toast-alert";
import { cn } from "@/lib/utils";

type SocialStatus = {
  kakao: boolean;
  naver: boolean;
};

export function SocialLoginButtons({ className }: { className?: string }) {
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [pending, setPending] = useState<"kakao" | "naver" | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/social-status")
      .then((res) => res.json())
      .then((data: SocialStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled) setStatus({ kakao: false, naver: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSocial(provider: "kakao" | "naver") {
    const ready = status?.[provider];
    if (!ready) {
      toast.error(
        provider === "kakao"
          ? "카카오 로그인을 쓰려면 .env.local에 AUTH_KAKAO_ID, AUTH_KAKAO_SECRET을 설정하세요."
          : "네이버 로그인을 쓰려면 .env.local에 AUTH_NAVER_ID, AUTH_NAVER_SECRET을 설정하세요.",
      );
      return;
    }

    setPending(provider);
    try {
      await signIn(provider, { callbackUrl: "/profile" });
    } catch {
      toast.error("소셜 로그인을 시작할 수 없습니다.");
      setPending(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <button
        type="button"
        disabled={pending != null}
        onClick={() => void handleSocial("naver")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] text-[15px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        <NaverMark />
        네이버로 시작하기
      </button>
      <button
        type="button"
        disabled={pending != null}
        onClick={() => void handleSocial("kakao")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#FEE500] text-[15px] font-semibold text-[#191919] transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        <KakaoMark />
        카카오로 시작하기
      </button>
    </div>
  );
}

function NaverMark() {
  return (
    <span
      aria-hidden
      className="flex size-5 items-center justify-center rounded-[3px] bg-white text-[11px] font-black leading-none text-[#03C75A]"
    >
      N
    </span>
  );
}

function KakaoMark() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 24 24"
      className="size-5"
      fill="currentColor"
    >
      <path d="M12 4C7.03 4 3 7.13 3 11c0 2.45 1.6 4.6 4.02 5.86-.13.47-.83 3.02-.86 3.22 0 0-.17.1.07.2.1.04.22 0 .22 0 .29-.04 3.35-2.21 3.88-2.58.55.08 1.11.12 1.67.12 4.97 0 9-3.13 9-7S16.97 4 12 4z" />
    </svg>
  );
}
