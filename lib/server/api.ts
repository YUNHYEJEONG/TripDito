import "server-only";
import { NextResponse } from "next/server";
import { getCurrentUser } from "@/auth";
import type { DbUser } from "@/lib/db/users";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
  ) {
    super(code);
  }
}

/** 로그인 + DB 회원이 있어야 하는 핸들러용 */
export async function requireUser(): Promise<DbUser> {
  const user = await getCurrentUser();
  if (!user) throw new ApiError(401, "UNAUTHORIZED");
  return user;
}

export async function readJson<T>(request: Request): Promise<T> {
  try {
    return (await request.json()) as T;
  } catch {
    throw new ApiError(400, "INVALID_JSON");
  }
}

/** 공통 에러 → JSON 응답 */
export function handleApi<T>(fn: () => Promise<T>, status = 200) {
  return fn().then(
    (data) => NextResponse.json(data, { status }),
    (error: unknown) => {
      if (error instanceof ApiError) {
        return NextResponse.json({ error: error.code }, { status: error.status });
      }
      if (error && typeof error === "object" && "issues" in error) {
        return NextResponse.json(
          { error: "VALIDATION", issues: (error as { issues: unknown }).issues },
          { status: 400 },
        );
      }
      console.error(error);
      return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
    },
  );
}
