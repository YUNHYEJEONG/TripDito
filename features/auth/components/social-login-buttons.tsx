"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { AuthProvider } from "../types";

type SocialProvider = Exclude<AuthProvider, "dev">;
type SocialStatus = Partial<Record<AuthProvider, boolean>>;

const NOT_CONFIGURED: Record<SocialProvider, string> = {
  google:
    "구글 로그인을 쓰려면 .env.local에 AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET을 설정하세요",
  kakao:
    "카카오 로그인을 쓰려면 .env.local에 AUTH_KAKAO_ID, AUTH_KAKAO_SECRET을 설정하세요",
  naver:
    "네이버 로그인을 쓰려면 .env.local에 AUTH_NAVER_ID, AUTH_NAVER_SECRET을 설정하세요",
};

export function SocialLoginButtons({
  className,
  callbackUrl = "/profile",
}: {
  className?: string;
  callbackUrl?: string;
}) {
  const [status, setStatus] = useState<SocialStatus | null>(null);
  const [pending, setPending] = useState<SocialProvider | null>(null);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/social-status")
      .then((res) => res.json())
      .then((data: SocialStatus) => {
        if (!cancelled) setStatus(data);
      })
      .catch(() => {
        if (!cancelled)
          setStatus({ google: false, kakao: false, naver: false });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSocial(provider: SocialProvider) {
    if (!status?.[provider]) {
      toast.error(NOT_CONFIGURED[provider]);
      return;
    }
    setPending(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error("소셜 로그인을 시작할 수 없습니다");
      setPending(null);
    }
  }

  return (
    <div className={cn("flex flex-col gap-2.5", className)}>
      <button
        type="button"
        disabled={pending != null}
        onClick={() => void handleSocial("google")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-border bg-white text-[15px] font-semibold text-[#1F1F1F] transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        <GoogleMark />
        구글로 시작하기
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
      <button
        type="button"
        disabled={pending != null}
        onClick={() => void handleSocial("naver")}
        className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#03C75A] text-[15px] font-semibold text-white transition-opacity hover:opacity-95 disabled:opacity-50"
      >
        <NaverMark />
        네이버로 시작하기
      </button>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg aria-hidden viewBox="0 0 24 24" className="size-5">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47a5.53 5.53 0 0 1-2.4 3.63v3h3.87c2.26-2.09 3.55-5.17 3.55-8.87z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.94-2.91l-3.87-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09A12 12 0 0 0 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29A7.2 7.2 0 0 1 4.89 12c0-.8.14-1.57.38-2.29V6.62H1.29A12 12 0 0 0 0 12c0 1.94.46 3.77 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.29 6.62l3.98 3.09C6.22 6.86 8.87 4.75 12 4.75z"
      />
    </svg>
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
