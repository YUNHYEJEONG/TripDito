import type { Shot, ShotSort } from "../schema";

export type ShotDestinationFilter = {
  city: string;
  country?: string;
} | null;

export function filterShotsByDestination(
  shots: Shot[],
  destination: ShotDestinationFilter,
) {
  if (!destination?.city) return shots;
  const city = destination.city.trim().toLowerCase();
  const country = destination.country?.trim().toLowerCase();
  return shots.filter((shot) => {
    const cityMatch = shot.destinationCity.trim().toLowerCase() === city;
    if (!country) return cityMatch;
    return (
      cityMatch && shot.destinationCountry.trim().toLowerCase() === country
    );
  });
}

export function sortShots(shots: Shot[], sort: ShotSort) {
  const copy = [...shots];
  if (sort === "likes") {
    return copy.sort((a, b) => {
      if (b.likeCount !== a.likeCount) return b.likeCount - a.likeCount;
      return (
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    });
  }
  return copy.sort(
    (a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  );
}

export function queryShots(
  shots: Shot[],
  options: {
    channel?: Shot["channel"];
    destination?: ShotDestinationFilter;
    sort?: ShotSort;
  },
) {
  let result = shots;
  if (options.channel) {
    result = result.filter((shot) => shot.channel === options.channel);
  }
  result = filterShotsByDestination(result, options.destination ?? null);
  return sortShots(result, options.sort ?? "newest");
}

/** 최근 30일 업로드 수가 많은 여행지 top N */
export function getHotDestinations(shots: Shot[], limit = 5) {
  const since = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const counts = new Map<
    string,
    { city: string; country: string; count: number }
  >();

  for (const shot of shots) {
    if (shot.channel !== "shots") continue;
    if (new Date(shot.createdAt).getTime() < since) continue;
    const key = `${shot.destinationCountry}::${shot.destinationCity}`;
    const prev = counts.get(key);
    if (prev) {
      prev.count += 1;
    } else {
      counts.set(key, {
        city: shot.destinationCity,
        country: shot.destinationCountry,
        count: 1,
      });
    }
  }

  return [...counts.values()]
    .sort((a, b) => b.count - a.count || a.city.localeCompare(b.city, "ko"))
    .slice(0, limit);
}

export function searchDestinations(
  destinations: readonly { city: string; country: string }[],
  query: string,
) {
  const q = query.trim().toLowerCase();
  if (!q) return [...destinations];
  return destinations.filter(
    (d) =>
      d.city.toLowerCase().includes(q) ||
      d.country.toLowerCase().includes(q),
  );
}
