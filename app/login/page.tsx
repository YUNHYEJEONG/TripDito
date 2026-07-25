"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { useEmailLogin } from "@/features/auth/hooks/use-auth";
import { FieldError } from "@/features/auth/components/field-error";

export default function LoginPage() {
  const router = useRouter();
  const emailLogin = useEmailLogin();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const nextPassword = password.trim();
    let hasError = false;

    if (!nextEmail) {
      setEmailError("이메일을 입력하세요");
      hasError = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailError("올바른 이메일 형식이 아닙니다");
      hasError = true;
    } else {
      setEmailError(null);
    }

    if (!nextPassword) {
      setPasswordError("비밀번호를 입력하세요");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) return;

    try {
      await emailLogin.mutateAsync({ email: nextEmail, password: nextPassword });
      toast.success("로그인되었습니다");
      router.replace("/profile");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인에 실패했습니다";
      setPasswordError(message);
    }
  }

  return (
    <AppShell>
      <PageHeader brand title="로그인" />

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-2">
        <h2 className="text-center text-[22px] font-bold tracking-tight text-foreground">
          로그인
        </h2>

        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              aria-invalid={Boolean(emailError)}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
            />
            <FieldError message={emailError} />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="비밀번호"
                className="pr-11"
                value={password}
                aria-invalid={Boolean(passwordError)}
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#848C94] transition-colors hover:text-foreground"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <FieldError message={passwordError} />
          </div>
          <Button
            type="submit"
            className="mt-1 w-full"
            disabled={emailLogin.isPending}
          >
            로그인
          </Button>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="text-[12px] text-muted-foreground">또는</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        <SocialLoginButtons />

        <p className="text-center text-[13px] text-muted-foreground">
          아직 계정이 없나요?{" "}
          <Link
            href="/signup"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            이메일로 회원가입
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
