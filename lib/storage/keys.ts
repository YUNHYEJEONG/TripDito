import { appConfig } from "@/config/app";

export const storageKeys = {
  trips: `${appConfig.storagePrefix}:trips`,
  items: `${appConfig.storagePrefix}:items`,
  meta: `${appConfig.storagePrefix}:meta`,
} as const;
