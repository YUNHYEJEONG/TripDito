"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { SocialLoginButtons } from "@/features/auth/components/social-login-buttons";
import { useEmailLogin, useIsLoggedIn } from "@/features/auth/hooks/use-auth";
import { FieldError } from "@/features/auth/components/field-error";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailLogin = useEmailLogin();
  const { isLoggedIn, isLoading: authLoading } = useIsLoggedIn();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const emailInputRef = useRef<HTMLInputElement>(null);
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"), "/profile");

  useEffect(() => {
    if (!authLoading && isLoggedIn) router.replace(returnTo);
  }, [authLoading, isLoggedIn, returnTo, router]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextEmail = email.trim();
    const nextPassword = password;
    let hasError = false;
    let emailInvalid = false;
    let passwordInvalid = false;

    if (!nextEmail) {
      setEmailError("이메일을 입력해 주세요");
      hasError = true;
      emailInvalid = true;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(nextEmail)) {
      setEmailError("이메일 형식을 다시 확인해 주세요");
      hasError = true;
      emailInvalid = true;
    } else {
      setEmailError(null);
    }

    if (!nextPassword) {
      setPasswordError("비밀번호를 입력해 주세요");
      hasError = true;
      passwordInvalid = true;
    } else {
      setPasswordError(null);
    }

    if (hasError) {
      if (emailInvalid) emailInputRef.current?.focus();
      else if (passwordInvalid) passwordInputRef.current?.focus();
      return;
    }

    try {
      await emailLogin.mutateAsync({ email: nextEmail, password: nextPassword });
      router.replace(returnTo);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인하지 못했어요";
      setPasswordError(message);
    }
  }

  return (
    <AppShell>
      <PageHeader brand title="로그인" backHref={returnTo} />

      <main className="mx-auto flex w-full max-w-sm flex-col gap-6 pt-4">
        <div className="space-y-2">
          <h1 className="text-[28px] leading-[1.3] font-bold tracking-[-0.02em] text-foreground">
            여행을 다시 이어가요
          </h1>
          <p className="text-[15px] leading-6 text-ink-2">
            저장한 여행과 쇼핑리스트, 때샷을 한곳에서 관리하세요.
          </p>
        </div>

        <SocialLoginButtons callbackUrl={returnTo} />

        <form
          className="flex flex-col gap-4"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <Label htmlFor="email" className="text-[15px] font-semibold">
              이메일
              <span className="sr-only"> (필수)</span>
            </Label>
            <Input
              id="email"
              ref={emailInputRef}
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              className="h-12 text-[15px]"
              value={email}
              aria-invalid={Boolean(emailError)}
              required
              aria-required="true"
              aria-describedby={emailError ? "login-email-error" : undefined}
              onChange={(event) => {
                setEmail(event.target.value);
                if (emailError) setEmailError(null);
              }}
            />
            {emailError ? (
              <div id="login-email-error" aria-live="polite">
                <FieldError message={emailError} />
              </div>
            ) : null}
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-[15px] font-semibold">
              비밀번호
              <span className="sr-only"> (필수)</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                ref={passwordInputRef}
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="비밀번호"
                className="h-12 pr-12 text-[15px]"
                value={password}
                aria-invalid={Boolean(passwordError)}
                required
                aria-required="true"
                aria-describedby={
                  passwordError ? "login-password-error" : undefined
                }
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute top-1/2 right-1 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-muted-foreground transition-colors duration-[var(--dur-fast)] hover:text-foreground active:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            {passwordError ? (
              <div id="login-password-error" aria-live="polite">
                <FieldError message={passwordError} />
              </div>
            ) : null}
          </div>
          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={emailLogin.isPending}
          >
            {emailLogin.isPending ? "로그인 중…" : "이메일로 로그인"}
          </Button>
        </form>

        <p className="text-center text-[13px] text-ink-2">
          아직 계정이 없나요?{" "}
          <Link
            href={withReturnTo("/signup", returnTo)}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-accent-text underline-offset-4 hover:underline active:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus"
          >
            이메일로 회원가입
          </Link>
        </p>
      </main>
    </AppShell>
  );
}
