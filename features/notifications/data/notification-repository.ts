import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { AppNotification, AppNotificationType } from "../types";

export const NOTIFICATIONS_CHANGE_EVENT = "tripdito:notifications-change";
const MAX_NOTIFICATIONS = 200;
const VALID_TYPES = new Set<AppNotificationType>([
  "trip-ended-favorite",
  "analysis-done",
  "coupang-cheaper",
  "general",
]);

function readAll(): AppNotification[] {
  const raw = getJson<unknown>(storageKeys.notifications, []);
  if (!Array.isArray(raw)) return [];
  return raw.filter((value): value is AppNotification => {
    if (!value || typeof value !== "object") return false;
    const item = value as Partial<AppNotification>;
    return Boolean(
      typeof item.id === "string" &&
        typeof item.title === "string" &&
        typeof item.href === "string" &&
        typeof item.createdAt === "string" &&
        typeof item.read === "boolean" &&
        item.type &&
        VALID_TYPES.has(item.type),
    );
  });
}

function writeAll(items: AppNotification[]) {
  setJson(storageKeys.notifications, items.slice(0, MAX_NOTIFICATIONS));
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(NOTIFICATIONS_CHANGE_EVENT));
  }
}

export const notificationRepository = {
  list(): AppNotification[] {
    return readAll().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  unreadCount(): number {
    return readAll().filter((n) => !n.read).length;
  },

  hasDedupeKey(dedupeKey: string): boolean {
    return readAll().some((n) => n.dedupeKey === dedupeKey);
  },

  create(input: {
    type: AppNotificationType;
    title: string;
    body?: string;
    href: string;
    dedupeKey?: string;
  }): AppNotification | null {
    if (input.dedupeKey && this.hasDedupeKey(input.dedupeKey)) {
      return null;
    }
    const item: AppNotification = {
      id: createId(),
      type: input.type,
      title: input.title,
      body: input.body,
      href: input.href,
      read: false,
      dedupeKey: input.dedupeKey,
      createdAt: new Date().toISOString(),
    };
    writeAll([item, ...readAll()]);
    return item;
  },

  markRead(id: string): AppNotification | null {
    const all = readAll();
    const index = all.findIndex((n) => n.id === id);
    if (index < 0) return null;
    const updated = { ...all[index], read: true };
    all[index] = updated;
    writeAll(all);
    return updated;
  },

  markAllRead() {
    writeAll(readAll().map((n) => ({ ...n, read: true })));
  },
};
