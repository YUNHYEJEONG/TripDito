import { appConfig } from "@/config/app";

export const storageKeys = {
  trips: `${appConfig.storagePrefix}:trips`,
  items: `${appConfig.storagePrefix}:items`,
  meta: `${appConfig.storagePrefix}:meta`,
  shots: `${appConfig.storagePrefix}:shots`,
  scraps: `${appConfig.storagePrefix}:scraps`,
  profile: `${appConfig.storagePrefix}:profile`,
} as const;
