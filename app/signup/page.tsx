import { redirect } from "next/navigation";

/** 이메일 회원가입은 제공하지 않는다 — 소셜 로그인으로 안내 */
export default function SignupPage() {
  redirect("/login");
}
