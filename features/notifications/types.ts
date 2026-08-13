export type AppNotificationType =
  | "trip-ended-favorite"
  | "analysis-done"
  | "coupang-cheaper"
  | "general";

export type AppNotification = {
  id: string;
  type: AppNotificationType;
  title: string;
  body?: string;
  href: string;
  read: boolean;
  /** 중복 방지용 (예: tripId) */
  dedupeKey?: string;
  createdAt: string;
};
