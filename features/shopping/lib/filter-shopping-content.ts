import type {
  ShoppingDestination,
  ShoppingMagazineItem,
  ShoppingRecommendItem,
} from "../data/demo-shopping-content";

function normalize(value: string) {
  return value.trim().toLowerCase();
}

function matchesDestination(
  country: string,
  regions: string[],
  destination: ShoppingDestination,
) {
  if (!destination) return true;
  if (normalize(country) !== normalize(destination.country)) return false;

  const cityKey = normalize(destination.city);
  const keys = regions.map(normalize);
  if (keys.includes("전국") || keys.length === 0) return true;
  return keys.some(
    (region) =>
      region === cityKey ||
      cityKey.includes(region) ||
      region.includes(cityKey),
  );
}

export function filterRecommendItems(
  items: ShoppingRecommendItem[],
  destination: ShoppingDestination,
) {
  return items.filter((item) =>
    matchesDestination(item.country, item.regions, destination),
  );
}

export function filterMagazineItems(
  items: ShoppingMagazineItem[],
  destination: ShoppingDestination,
) {
  return items.filter((item) =>
    matchesDestination(item.country, item.regions, destination),
  );
}
