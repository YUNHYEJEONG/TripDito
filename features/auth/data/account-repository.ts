import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import { hashPassword, normalizeEmail } from "../lib/password";
import type { LocalAccount } from "../types";

function readAccounts(): LocalAccount[] {
  return getJson<LocalAccount[]>(storageKeys.accounts, []).map((account) => ({
    ...account,
    homeCountry: account.homeCountry?.trim() || "한국",
  }));
}

function writeAccounts(accounts: LocalAccount[]) {
  setJson(storageKeys.accounts, accounts);
}

export const accountRepository = {
  list(): LocalAccount[] {
    return readAccounts();
  },

  findByEmail(email: string): LocalAccount | null {
    const normalized = normalizeEmail(email);
    return (
      readAccounts().find((account) => account.email === normalized) ?? null
    );
  },

  isEmailTaken(email: string): boolean {
    return this.findByEmail(email) != null;
  },

  async create(input: {
    email: string;
    password: string;
    nickname: string;
    homeCountry: string;
  }): Promise<LocalAccount> {
    const email = normalizeEmail(input.email);
    if (!email) throw new Error("이메일을 입력해 주세요");
    if (!input.password) throw new Error("비밀번호를 입력해 주세요");
    if (!input.nickname.trim()) throw new Error("닉네임을 입력해 주세요");
    if (!input.homeCountry.trim()) throw new Error("사는 국가를 선택해 주세요");
    if (this.isEmailTaken(email)) {
      throw new Error("이미 사용 중인 이메일입니다");
    }

    const account: LocalAccount = {
      email,
      passwordHash: await hashPassword(input.password),
      nickname: input.nickname.trim(),
      homeCountry: input.homeCountry.trim(),
      createdAt: new Date().toISOString(),
    };
    writeAccounts([...readAccounts(), account]);
    return account;
  },

  async verify(email: string, password: string): Promise<LocalAccount> {
    const account = this.findByEmail(email);
    if (!account) throw new Error("이메일 또는 비밀번호가 올바르지 않아요");
    const passwordHash = await hashPassword(password);
    if (passwordHash !== account.passwordHash) {
      throw new Error("이메일 또는 비밀번호가 올바르지 않아요");
    }
    return account;
  },
};
