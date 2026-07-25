import { createId } from "@/lib/storage/id";
import { getJson, setJson } from "@/lib/storage/local-storage";
import { storageKeys } from "@/lib/storage/keys";
import type { Scrap } from "../schema";

function readScraps(): Scrap[] {
  return getJson<Scrap[]>(storageKeys.scraps, []);
}

function writeScraps(scraps: Scrap[]) {
  setJson(storageKeys.scraps, scraps);
}

export const scrapRepository = {
  list(): Scrap[] {
    return readScraps().sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
  },

  has(shotId: string): boolean {
    return readScraps().some((scrap) => scrap.shotId === shotId);
  },

  toggle(shotId: string): { scraped: boolean; scraps: Scrap[] } {
    const scraps = readScraps();
    const existing = scraps.find((scrap) => scrap.shotId === shotId);
    if (existing) {
      const next = scraps.filter((scrap) => scrap.shotId !== shotId);
      writeScraps(next);
      return { scraped: false, scraps: next };
    }
    const scrap: Scrap = {
      id: createId(),
      shotId,
      createdAt: new Date().toISOString(),
    };
    const next = [scrap, ...scraps];
    writeScraps(next);
    return { scraped: true, scraps: next };
  },
};
