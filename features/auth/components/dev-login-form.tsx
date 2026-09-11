"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { signIn } from "next-auth/react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldError } from "./field-error";

/**
 * 테스트 단계 공용 계정. 서버 .env 의 DEV_LOGIN_EMAIL / DEV_LOGIN_PASSWORD 와 같아야 한다.
 * 소셜 로그인이 열리면 이 폼과 함께 걷어낸다.
 */
const TEST_ACCOUNT = { email: "test@naver.com", password: "tripdito1234" };

/**
 * 소셜 키 발급 전 임시 개발용 로그인 폼.
 * 서버의 ENABLE_DEV_LOGIN 이 켜져 있을 때만 렌더링된다.
 */
export function DevLoginForm({ callbackUrl = "/profile" }: { callbackUrl?: string }) {
  const router = useRouter();
  const [enabled, setEnabled] = useState(false);
  const [email, setEmail] = useState(TEST_ACCOUNT.email);
  const [password, setPassword] = useState(TEST_ACCOUNT.password);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void fetch("/api/auth/social-status")
      .then((res) => res.json())
      .then((data: { dev?: boolean }) => {
        if (!cancelled) setEnabled(Boolean(data.dev));
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, []);

  if (!enabled) return null;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!email.trim() || !password) {
      setError("이메일과 비밀번호를 입력하세요");
      return;
    }
    setPending(true);
    setError(null);
    try {
      const result = await signIn("dev", {
        email: email.trim(),
        password,
        redirect: false,
      });
      if (!result || result.error) {
        setError("이메일 또는 비밀번호가 올바르지 않습니다");
        return;
      }
      toast.success("로그인되었습니다");
      router.replace(callbackUrl);
      router.refresh();
    } catch {
      setError("로그인에 실패했습니다");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-border" />
        <span className="text-[12px] text-muted-foreground">테스트 계정 로그인</span>
        <div className="h-px flex-1 bg-border" />
      </div>
      <form className="flex flex-col gap-3" noValidate onSubmit={handleSubmit}>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-email">이메일</Label>
          <Input
            id="dev-email"
            type="email"
            autoComplete="username"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
          />
        </div>
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="dev-password">비밀번호</Label>
          <div className="relative">
            <Input
              id="dev-password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="pr-11"
              value={password}
              aria-invalid={Boolean(error)}
              onChange={(event) => setPassword(event.target.value)}
            />
            <button
              type="button"
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
              className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#848C94] transition-colors hover:text-foreground"
              onClick={() => setShowPassword((value) => !value)}
            >
              {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
            </button>
          </div>
          <FieldError message={error} />
        </div>
        <Button type="submit" className="w-full" disabled={pending}>
          테스트 계정으로 로그인
        </Button>
      </form>
      <p className="text-center text-[11px] text-muted-foreground">
        테스트 단계라 계정이 미리 채워져 있어요. 그대로 로그인하면 됩니다.
      </p>
    </div>
  );
}
