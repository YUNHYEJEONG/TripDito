import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { AppNotification, AppNotificationType } from "../types";

function readAll(): AppNotification[] {
  return getJson<AppNotification[]>(storageKeys.notifications, []);
}

function writeAll(items: AppNotification[]) {
  setJson(storageKeys.notifications, items);
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
