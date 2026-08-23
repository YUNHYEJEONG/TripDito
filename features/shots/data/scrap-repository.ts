import { api } from "@/lib/api/client";
import { fromShotDto, shotRepository } from "./shot-repository";
import type { Scrap } from "../schema";

export const scrapRepository = {
  /** 프로필 > 내 스크랩 (최근 순). 각 스크랩에 게시글을 함께 담는다 */
  async list(): Promise<Scrap[]> {
    const rows = await api<Parameters<typeof fromShotDto>[0][]>(
      "/api/me/scraps",
    );
    return rows.map((dto) => {
      const shot = fromShotDto(dto);
      return { id: shot.id, shotId: shot.id, createdAt: shot.createdAt, shot };
    });
  },

  async toggle(shotId: string): Promise<{ scraped: boolean }> {
    const shot = await shotRepository.toggleScrap(shotId);
    return { scraped: Boolean(shot.scrappedByMe) };
  },
};
