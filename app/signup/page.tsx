"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { FieldActionRow } from "@/components/ui/field-action-row";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { listDestinationCountries } from "@/features/destinations/constants";
import { accountRepository } from "@/features/auth/data/account-repository";
import { useEmailSignup } from "@/features/auth/hooks/use-auth";
import { normalizeEmail } from "@/features/auth/lib/password";
import { createSignupCompletion } from "@/features/auth/lib/signup-completion";
import { getSafeReturnTo, withReturnTo } from "@/lib/navigation/return-to";
import { useUnsavedChanges } from "@/lib/navigation/unsaved-changes";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signup = useEmailSignup();
  const countries = useMemo(() => listDestinationCountries(), []);
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [homeCountry, setHomeCountry] = useState("한국");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [nicknameError, setNicknameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailOk, setEmailOk] = useState<string | null>(null);
  const [emailChecked, setEmailChecked] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [homeCountryError, setHomeCountryError] = useState<string | null>(null);
  const [passwordConfirmError, setPasswordConfirmError] = useState<
    string | null
  >(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const returnTo = getSafeReturnTo(searchParams.get("returnTo"), "/home");
  const signupDirty = Boolean(nickname || email || password || passwordConfirm || homeCountry !== "한국");
  useUnsavedChanges(signupDirty);

  function checkEmailDuplicate() {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      setEmailError("이메일을 입력해 주세요.");
      setEmailOk(null);
      setEmailChecked(false);
      document.getElementById("email")?.focus();
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)) {
      setEmailError("이메일 형식을 다시 확인해 주세요.");
      setEmailOk(null);
      setEmailChecked(false);
      document.getElementById("email")?.focus();
      return false;
    }
    if (accountRepository.isEmailTaken(normalized)) {
      setEmailError("이미 사용 중인 이메일이에요.");
      setEmailOk(null);
      setEmailChecked(false);
      document.getElementById("email")?.focus();
      return false;
    }
    setEmailError(null);
    setEmailOk("이 이메일로 가입할 수 있어요.");
    setEmailChecked(true);
    return true;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    const nextNickname = nickname.trim();
    const nextEmail = normalizeEmail(email);
    const nextHomeCountry = homeCountry.trim();
    let hasError = false;
    let firstInvalidId: string | null = null;

    setSubmitError(null);

    if (!nextNickname) {
      setNicknameError("닉네임을 입력해 주세요.");
      hasError = true;
      firstInvalidId = "nickname";
    } else {
      setNicknameError(null);
    }

    if (!nextEmail) {
      setEmailError("이메일을 입력해 주세요.");
      setEmailOk(null);
      setEmailChecked(false);
      hasError = true;
      firstInvalidId ??= "email";
    } else if (!emailChecked || emailError) {
      if (!checkEmailDuplicate()) {
        hasError = true;
        firstInvalidId ??= "email";
      }
    } else if (accountRepository.isEmailTaken(nextEmail)) {
      setEmailError("이미 사용 중인 이메일이에요.");
      setEmailOk(null);
      setEmailChecked(false);
      hasError = true;
      firstInvalidId ??= "email";
    }

    if (password.length < 6) {
      setPasswordError("비밀번호를 6자 이상 입력해 주세요.");
      hasError = true;
      firstInvalidId ??= "password";
    } else {
      setPasswordError(null);
    }

    if (!nextHomeCountry) {
      setHomeCountryError("사는 국가를 선택해 주세요.");
      hasError = true;
      firstInvalidId ??= "homeCountry";
    } else {
      setHomeCountryError(null);
    }

    if (!passwordConfirm) {
      setPasswordConfirmError("비밀번호를 한 번 더 입력해 주세요.");
      hasError = true;
      firstInvalidId ??= "passwordConfirm";
    } else if (password !== passwordConfirm) {
      setPasswordConfirmError("두 비밀번호가 같지 않아요.");
      hasError = true;
      firstInvalidId ??= "passwordConfirm";
    } else {
      setPasswordConfirmError(null);
    }

    if (hasError) {
      if (firstInvalidId) document.getElementById(firstInvalidId)?.focus();
      return;
    }

    try {
      await signup.mutateAsync({
        nickname: nextNickname,
        email: nextEmail,
        password,
        homeCountry: nextHomeCountry,
      });
      const completionToken = createSignupCompletion();
      router.replace(
        `/signup/complete?completion=${encodeURIComponent(completionToken)}&returnTo=${encodeURIComponent(returnTo)}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "계정을 만들지 못했어요.";
      if (message.includes("이메일")) {
        setEmailError(message);
        setEmailOk(null);
        setEmailChecked(false);
        document.getElementById("email")?.focus();
      } else if (message.includes("닉네임")) {
        setNicknameError(message);
        document.getElementById("nickname")?.focus();
      } else if (message.includes("비밀번호")) {
        setPasswordError(message);
        document.getElementById("password")?.focus();
      } else {
        setSubmitError(`${message} 다시 시도해 주세요.`);
      }
    }
  }

  return (
    <AppShell>
      <PageHeader
        title="회원가입"
        backHref={withReturnTo("/login", returnTo)}
      />

      <main className="mx-auto flex w-full max-w-md flex-col gap-6 pt-2">
        <div className="space-y-2">
          <h2 className="text-[22px] leading-[1.35] font-bold tracking-[-0.02em] text-ink">
            여행 기록을 내 계정에 연결해요
          </h2>
          <p className="text-[15px] leading-6 text-ink-2">
            닉네임과 이메일만 등록하면 여행 준비를 바로 이어갈 수 있어요.
          </p>
        </div>

        <form
          className="flex flex-col gap-5"
          data-unsaved={signupDirty ? "true" : undefined}
          aria-busy={signup.isPending}
          noValidate
          onSubmit={handleSubmit}
        >
          <div className="flex flex-col gap-2">
            <Label
              htmlFor="nickname"
              className="text-[15px] font-semibold text-ink"
            >
              닉네임
              <span className="sr-only"> (필수)</span>
            </Label>
            <Input
              id="nickname"
              autoComplete="nickname"
              maxLength={20}
              placeholder="예: 여행자 디토"
              value={nickname}
              aria-invalid={Boolean(nicknameError)}
              required
              aria-required="true"
              aria-describedby="signup-nickname-message"
              onChange={(event) => {
                setNickname(event.target.value);
                if (nicknameError) setNicknameError(null);
                if (submitError) setSubmitError(null);
              }}
            />
            <FieldFeedback
              id="signup-nickname-message"
              error={nicknameError}
              message="다른 사용자에게 보일 이름이에요."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="email"
              className="text-[15px] font-semibold text-ink"
            >
              이메일
              <span className="sr-only"> (필수)</span>
            </Label>
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
                required
                aria-required="true"
                aria-describedby="signup-email-message"
                onChange={(event) => {
                  setEmail(event.target.value);
                  setEmailError(null);
                  setEmailOk(null);
                  setEmailChecked(false);
                  if (submitError) setSubmitError(null);
                }}
              />
              <Button
                type="button"
                variant="surfaceOutline"
                className="h-11 shrink-0 px-3 active:translate-y-0"
                onClick={checkEmailDuplicate}
              >
                중복 확인
              </Button>
            </FieldActionRow>
            <FieldFeedback
              id="signup-email-message"
              error={emailError}
              message={emailOk ?? "가입에 사용할 이메일을 입력해 주세요."}
              tone={emailOk ? "success" : "info"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="homeCountry" className="text-[15px] font-semibold text-ink">
              사는 국가
              <span className="sr-only"> (필수)</span>
            </Label>
            <Select
              value={homeCountry}
              onValueChange={(value) => {
                if (!value) return;
                setHomeCountry(value);
                setHomeCountryError(null);
                if (submitError) setSubmitError(null);
              }}
            >
              <SelectTrigger
                id="homeCountry"
                className="w-full"
                aria-invalid={Boolean(homeCountryError)}
                aria-describedby="signup-home-country-message"
              >
                <SelectValue placeholder="국가 선택" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((country) => (
                  <SelectItem key={country} value={country}>{country}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <FieldFeedback
              id="signup-home-country-message"
              error={homeCountryError}
              message="현재 거주 중인 국가예요. 여행지와는 별개예요."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="password"
              className="text-[15px] font-semibold text-ink"
            >
              비밀번호
              <span className="sr-only"> (필수)</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="new-password"
                placeholder="6자 이상"
                className="pr-12"
                value={password}
                aria-invalid={Boolean(passwordError)}
                required
                aria-required="true"
                aria-describedby="signup-password-message"
                onChange={(event) => {
                  setPassword(event.target.value);
                  if (passwordError) setPasswordError(null);
                  if (submitError) setSubmitError(null);
                }}
              />
              <button
                type="button"
                aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
                className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2 transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                onClick={() => setShowPassword((value) => !value)}
              >
                {showPassword ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            <FieldFeedback
              id="signup-password-message"
              error={passwordError}
              message="6자 이상 입력해 주세요."
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label
              htmlFor="passwordConfirm"
              className="text-[15px] font-semibold text-ink"
            >
              비밀번호 확인
              <span className="sr-only"> (필수)</span>
            </Label>
            <div className="relative">
              <Input
                id="passwordConfirm"
                type={showPasswordConfirm ? "text" : "password"}
                autoComplete="new-password"
                placeholder="비밀번호 다시 입력"
                className="pr-12"
                value={passwordConfirm}
                aria-invalid={Boolean(passwordConfirmError)}
                required
                aria-required="true"
                aria-describedby="signup-password-confirm-message"
                onChange={(event) => {
                  setPasswordConfirm(event.target.value);
                  if (passwordConfirmError) setPasswordConfirmError(null);
                  if (submitError) setSubmitError(null);
                }}
              />
              <button
                type="button"
                aria-label={
                  showPasswordConfirm
                    ? "비밀번호 확인 숨기기"
                    : "비밀번호 확인 보기"
                }
                className="absolute top-1/2 right-0 flex size-11 -translate-y-1/2 items-center justify-center rounded-lg text-ink-2 transition-colors duration-120 hover:bg-paper-2 hover:text-ink active:bg-paper-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
                onClick={() => setShowPasswordConfirm((value) => !value)}
              >
                {showPasswordConfirm ? (
                  <EyeOff className="size-5" />
                ) : (
                  <Eye className="size-5" />
                )}
              </button>
            </div>
            <FieldFeedback
              id="signup-password-confirm-message"
              error={passwordConfirmError}
              message="같은 비밀번호를 한 번 더 입력해 주세요."
            />
          </div>

          <p
            className="min-h-5 text-[12px] leading-5 text-ink"
            aria-live="polite"
          >
            {submitError ?? <span aria-hidden>&nbsp;</span>}
          </p>

          <div className="sticky bottom-0 z-10 -mx-4 bg-paper/95 px-4 pt-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur-sm">
            <Button
              type="submit"
              className="w-full"
              disabled={signup.isPending}
            >
              {signup.isPending ? "계정 만드는 중…" : "계정 만들기"}
            </Button>
          </div>
        </form>

        <p className="text-center text-[13px] text-ink-2">
          이미 계정이 있나요?{" "}
          <Link
            href={`/login?returnTo=${encodeURIComponent(returnTo)}`}
            className="inline-flex min-h-11 items-center rounded-sm font-semibold text-accent-text underline-offset-4 hover:underline active:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
          >
            로그인
          </Link>
        </p>
      </main>
    </AppShell>
  );
}

function FieldFeedback({
  id,
  error,
  message,
  tone = "info",
}: {
  id: string;
  error?: string | null;
  message: string;
  tone?: "info" | "success";
}) {
  return (
    <p
      id={id}
      className={
        error
          ? "min-h-5 text-[12px] leading-5 text-ink"
          : tone === "success"
            ? "min-h-5 text-[12px] leading-5 text-success-text"
            : "min-h-5 text-[12px] leading-5 text-ink-2"
      }
      aria-live="polite"
    >
      {error ?? message}
    </p>
  );
}
