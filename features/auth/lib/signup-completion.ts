const SIGNUP_COMPLETION_KEY = "tripdito:signup-completion";
const SIGNUP_COMPLETION_TTL_MS = 5 * 60 * 1000;

type SignupCompletion = {
  token: string;
  createdAt: number;
};

export function createSignupCompletion(): string {
  const token = crypto.randomUUID();
  const completion: SignupCompletion = {
    token,
    createdAt: Date.now(),
  };
  sessionStorage.setItem(SIGNUP_COMPLETION_KEY, JSON.stringify(completion));
  return token;
}

export function isSignupCompletionValid(token: string | null): boolean {
  if (!token) return false;

  const raw = sessionStorage.getItem(SIGNUP_COMPLETION_KEY);
  if (!raw) return false;

  try {
    const completion = JSON.parse(raw) as Partial<SignupCompletion>;
    return (
      completion.token === token &&
      typeof completion.createdAt === "number" &&
      Date.now() - completion.createdAt <= SIGNUP_COMPLETION_TTL_MS
    );
  } catch {
    return false;
  }
}

export function clearSignupCompletion() {
  sessionStorage.removeItem(SIGNUP_COMPLETION_KEY);
}
