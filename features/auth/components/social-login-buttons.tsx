"use client";

import { useEffect, useState } from "react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

type SocialStatus = {
  kakao: boolean;
  naver: boolean;
};

export function SocialLoginButtons({
  className,
  callbackUrl = "/profile",
}: {
  className?: string;
  callbackUrl?: string;
}) {
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
          ? "현재 카카오 로그인을 이용할 수 없어요. 이메일로 계속해 주세요."
          : "현재 네이버 로그인을 이용할 수 없어요. 이메일로 계속해 주세요.",
      );
      return;
    }

    setPending(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch {
      toast.error("소셜 로그인을 시작하지 못했어요. 잠시 후 다시 시도해 주세요.");
      setPending(null);
    }
  }

  const readyProviders = status
    ? (["kakao", "naver"] as const).filter((provider) => status[provider])
    : [];

  if (readyProviders.length === 0) return null;

  return (
    <div
      className={cn("flex flex-col gap-3", className)}
      aria-busy={pending != null}
    >
      {readyProviders.map((provider) => (
        <button
          key={provider}
          type="button"
          disabled={pending != null}
          onClick={() => void handleSocial(provider)}
          className={cn(
            "flex h-12 w-full items-center justify-center gap-2 rounded-xl px-4 text-[15px] font-semibold transition-opacity duration-[var(--dur-fast)] hover:opacity-90 active:opacity-80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:cursor-wait disabled:opacity-55",
            provider === "kakao"
              ? "bg-[var(--brand-kakao)] text-[var(--brand-kakao-ink)]"
              : "bg-[var(--brand-naver)] text-[var(--brand-naver-ink)]",
          )}
        >
          {provider === "kakao" ? <KakaoMark /> : <NaverMark />}
          {pending === provider
            ? `${provider === "kakao" ? "카카오" : "네이버"}로 연결 중…`
            : `${provider === "kakao" ? "카카오" : "네이버"}로 계속`}
        </button>
      ))}

      <div className="flex items-center gap-3" role="separator">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] font-medium text-ink-2">
          이메일로 계속
        </span>
        <div className="h-px flex-1 bg-border" />
      </div>
    </div>
  );
}

function NaverMark() {
  return (
    <span
      aria-hidden
      className="flex size-5 items-center justify-center rounded-xs bg-paper text-[11px] leading-none font-black text-[var(--brand-naver)]"
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
