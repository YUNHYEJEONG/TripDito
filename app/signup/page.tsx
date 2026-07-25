"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FieldActionRow } from "@/components/ui/field-action-row";
import { accountRepository } from "@/features/auth/data/account-repository";
import { FieldError } from "@/features/auth/components/field-error";
import { useEmailSignup } from "@/features/auth/hooks/use-auth";
import { normalizeEmail } from "@/features/auth/lib/password";

export default function SignupPage() {
  const router = useRouter();
  const signup = useEmailSignup();
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailOk, setEmailOk] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<
    string | null
  >(null);

  function checkEmailDuplicate() {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      setEmailError("이메일을 입력하세요");
      setEmailOk(null);
      setEmailChecked(false);
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setEmailError("올바른 이메일 형식이 아닙니다");
      setEmailOk(null);
      setEmailChecked(false);
      return false;
    }
    if (accountRepository.isEmailTaken(normalized)) {
      setEmailError("이미 사용 중인 이메일입니다");
      setEmailOk(null);
      setEmailChecked(false);
      return false;
    }
    setEmailError(null);
    setEmailOk("사용 가능한 이메일입니다");
    setEmailChecked(true);
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextNickname = nickname.trim();
    const nextEmail = normalizeEmail(email);
    let hasError = false;

    if (!nextNickname) {
      setNicknameError("닉네임을 입력하세요");
      hasError = true;
    } else {
      setNicknameError(null);
    }

    if (!nextEmail) {
      setEmailError("이메일을 입력하세요");
      setEmailOk(null);
      setEmailChecked(false);
      hasError = true;
    } else if (!emailChecked || emailError) {
      if (!checkEmailDuplicate()) hasError = true;
    } else if (accountRepository.isEmailTaken(nextEmail)) {
      setEmailError("이미 사용 중인 이메일입니다");
      setEmailOk(null);
      setEmailChecked(false);
      hasError = true;
    }

    if (password.length < 6) {
      setPasswordError("비밀번호는 6자 이상이어야 합니다");
      hasError = true;
    } else {
      setPasswordError(null);
    }

    if (!passwordConfirm) {
      setPasswordConfirmError("비밀번호 확인을 입력하세요");
      hasError = true;
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError("비밀번호가 일치하지 않습니다");
      hasError = true;
    } else {
      setPasswordConfirmError(null);
    }

    if (hasError) return;

    try {
      await signup.mutateAsync({
        nickname: nextNickname,
        email: nextEmail,
        password,
      });
      router.replace("/signup/complete");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "회원가입에 실패했습니다";
      if (message.includes("이메일")) {
        setEmailError(message);
        setEmailOk(null);
        setEmailChecked(false);
      } else if (message.includes("닉네임")) {
        setNicknameError(message);
      } else if (message.includes("비밀번호")) {
        setPasswordError(message);
      } else {
        setPasswordConfirmError(message);
      }
    }
  }

  return (
    <AppShell>
      <PageHeader brand title="회원가입" />

      <div className="mx-auto flex w-full max-w-md flex-col gap-6 pt-2">
        <h2 className="text-center text-[22px] font-bold tracking-tight text-foreground">
          회원가입
        </h2>

        <form
          className="flex flex-col gap-3"
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="nickname">닉네임</Label>
            <Input
              id="nickname"
              autoComplete="nickname"
              maxLength={20}
              placeholder="닉네임"
              value={nickname}
              aria-invalid={Boolean(nicknameError)}
              onChange={(event) => {
                setNickname(event.target.value);
                if (nicknameError) setNicknameError(null);
              }}
            />
            <FieldError message={nicknameError} />
          </div>
            <div className="flex flex-col gap-1.5">
            <Label htmlFor="email">이메일</Label>
            <FieldActionRow>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                variant="field"
                className="min-w-0 flex-1"
                value={email}
                aria-invalid={Boolean(emailError)}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                  setEmailOk(null);
                  setEmailChecked(false);
                }}
              />
              <Button
                type="button"
                variant="surfaceOutline"
                size="fieldAction"
                className="shrink-0 px-2.5 active:translate-y-0"
                onClick={() => checkEmailDuplicate()}
              >
                중복검사
              </Button>
            </FieldActionRow>
            {emailError ? (
              <FieldError message={emailError} />
            ) : emailOk ? (
              <p className="text-[12px] leading-snug text-primary">{emailOk}</p>
            ) : null}
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="password">비밀번호</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="6자 이상"
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
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="passwordConfirm">비밀번호 확인</Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="비밀번호 재입력"
                className="pr-11"
                value={passwordConfirm}
                aria-invalid={Boolean(passwordConfirmError)}
                onChange={(event) => {
                  setPasswordConfirm(event.target.value);
                  if (passwordConfirmError) setPasswordConfirmError(null);
                }}
              />
              <button
                type="button"
                aria-label={
                  showPasswordConfirm
                    ? "비밀번호 확인 숨기기"
                    : "비밀번호 확인 보기"
                }
                className="absolute top-1/2 right-2.5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md text-[#848C94] transition-colors hover:text-foreground"
                onClick={() => setShowPasswordConfirm((value) => !value)}
              >
                {showPasswordConfirm ? (
                  <EyeOff className="size-4" />
                ) : (
                  <Eye className="size-4" />
                )}
              </button>
            </div>
            <FieldError message={passwordConfirmError} />
          </div>
          <Button
            type="submit"
            className="mt-1 w-full"
            disabled={signup.isPending}
          >
            가입하기
          </Button>
        </form>

        <p className="text-center text-[13px] text-muted-foreground">
          이미 계정이 있나요?{" "}
          <Link
            href="/login"
            className="font-semibold text-primary underline-offset-2 hover:underline"
          >
            로그인
          </Link>
        </p>
      </div>
    </AppShell>
  );
}
