"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Footprints, LoaderCircle, LocateFixed, MapPinned, Search, Star, Ticket } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AlertDialog } from "@/components/common/alert-dialog";
import { PlaceBottomSheet } from "@/features/map/components/place-bottom-sheet";
import { loadGoogleMaps, SEOUL } from "@/features/map/lib/load-google-maps";
import { useTrips } from "@/features/trips/hooks/use-trips";
import { selectHomeTrip } from "@/features/home/utils/get-home-mode";
import { useCreateItem } from "@/features/shopping-items/hooks/use-items";
import {
  useActiveTripId,
  useSelectActiveTrip,
} from "@/features/home/hooks/use-active-trip";
import { getTripHomeMode } from "@/features/home/utils/get-home-mode";
import { todayIsoDate } from "@/features/home/utils/get-upcoming-trip";
import { cn } from "@/lib/utils";
import { withReturnTo } from "@/lib/navigation/return-to";
import { DemoMapExplorer } from "@/features/map/components/demo-map-explorer";

declare global {
  interface Window {
    gm_authFailure?: () => void;
  }
}

type MarkerItem = {
  id: string;
  title: string;
  marker: google.maps.Marker;
};

type PlaceRequestElement = HTMLElement & { place: string };

type SelectedPlace = {
  id: string;
  name: string;
  rating?: number;
};

function createInfoLabel(label: string) {
  const element = document.createElement("strong");
  element.textContent = label;
  return element;
}

export function GoogleMapExplorer({
  apiKey,
  initialQuery,
  initialPlaceId,
}: {
  apiKey: string;
  initialQuery: string;
  initialPlaceId: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const mapRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null,
  );

  const mapInstance = useRef<google.maps.Map | null>(null);
  const infoRef = useRef<google.maps.InfoWindow | null>(null);
  const meMarkerRef = useRef<google.maps.Marker | null>(null);
  const selectedMarkerRef = useRef<google.maps.Marker | null>(null);
  const markersRef = useRef<MarkerItem[]>([]);
  const markerSeq = useRef(0);
  const panTimerRef = useRef<number | null>(null);
  const resumedPlaceRef = useRef("");

  const [error, setError] = useState<string | null>(null);
  const [mapUnavailable, setMapUnavailable] = useState(false);
  const [ready, setReady] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlace | null>(null);
  const [permissionHelp, setPermissionHelp] = useState<{
    kind: "site" | "os";
    step: "ask" | "guide";
  } | null>(null);
  const { data: trips = [] } = useTrips();
  const { data: activeTripId = null } = useActiveTripId();
  const selectActiveTrip = useSelectActiveTrip();
  const selectedTrip = trips.find((trip) => trip.id === activeTripId);
  const activeTrip =
    selectedTrip ?? selectHomeTrip(trips) ?? trips[0] ?? null;
  const createItem = useCreateItem(activeTrip?.id ?? "");

  const closePlacePanel = useCallback(() => {
    if (panTimerRef.current != null) {
      window.clearTimeout(panTimerRef.current);
      panTimerRef.current = null;
    }
    setPlaceOpen(false);
    setSelectedPlace(null);
    const request = document.getElementById(
      "placeDetailsRequest",
    ) as PlaceRequestElement | null;
    if (request) request.place = "";
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.setMap(null);
      selectedMarkerRef.current = null;
    }
  }, []);

  const showPlaceDetails = useCallback(
    (
      placeId: string,
      location?: google.maps.LatLng | google.maps.LatLngLiteral | null,
      title?: string,
    ) => {
      const request = document.getElementById(
        "placeDetailsRequest",
      ) as PlaceRequestElement | null;
      if (!request || !mapInstance.current) return;
      setPlaceOpen(true);
      setSelectedPlace({ id: placeId, name: title ?? "" });
      request.place = placeId;

      placesServiceRef.current?.getDetails(
        { placeId, fields: ["name", "rating"] },
        (place, status) => {
          if (
            status !== google.maps.places.PlacesServiceStatus.OK ||
            !place
          ) {
            return;
          }
          setSelectedPlace((current) =>
            current?.id === placeId
              ? {
                  ...current,
                  name: place.name || current.name,
                  rating: place.rating,
                }
              : current,
          );
        },
      );

      if (location) {
        mapInstance.current.panTo(location);
        if ((mapInstance.current.getZoom() || 0) < 15) {
          mapInstance.current.setZoom(16);
        }
        if (selectedMarkerRef.current) selectedMarkerRef.current.setMap(null);
        selectedMarkerRef.current = new google.maps.Marker({
          position: location,
          map: mapInstance.current,
          title: "선택 장소",
        });
        // 절반 시트에 가리지 않도록 지도를 위로 살짝 보정
        if (panTimerRef.current != null) {
          window.clearTimeout(panTimerRef.current);
        }
        panTimerRef.current = window.setTimeout(() => {
          const h = mapInstance.current?.getDiv().clientHeight ?? 0;
          mapInstance.current?.panBy(0, Math.round(h * 0.18));
          panTimerRef.current = null;
        }, 80);
      }
    },
    [],
  );

  const focusMarker = useCallback((item: MarkerItem) => {
    if (!mapInstance.current || !infoRef.current) return;
    mapInstance.current.panTo(item.marker.getPosition()!);
    mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom() || 0, 15));
    infoRef.current.setContent(createInfoLabel(item.title));
    infoRef.current.open({ map: mapInstance.current, anchor: item.marker });
  }, []);

  const addMarker = useCallback(
    (
      latLng: google.maps.LatLng | google.maps.LatLngLiteral,
      title?: string,
    ) => {
      if (!mapInstance.current) return null;
      const id = `m${++markerSeq.current}`;
      const label = title || `마커 ${markerSeq.current}`;
      const marker = new google.maps.Marker({
        position: latLng,
        map: mapInstance.current,
        title: label,
        draggable: true,
      });
      const item: MarkerItem = { id, marker, title: label };
      marker.addListener("click", () => focusMarker(item));
      markersRef.current.push(item);
      return item;
    },
    [focusMarker],
  );

  const applyPlaceResult = useCallback(
    (place: google.maps.places.PlaceResult) => {
      if (!mapInstance.current) return;
      if (place.place_id) {
        showPlaceDetails(
          place.place_id,
          place.geometry?.location ?? null,
          place.name,
        );
        if (place.geometry?.viewport) {
          mapInstance.current.fitBounds(place.geometry.viewport);
        }
        return;
      }
      if (!place.geometry?.location) {
        setError("검색 결과가 없어요. 다른 이름이나 주소로 검색해 주세요.");
        return;
      }
      const title = place.name || place.formatted_address || "검색 결과";
      if (place.geometry.viewport) {
        mapInstance.current.fitBounds(place.geometry.viewport);
      } else {
        mapInstance.current.setCenter(place.geometry.location);
        mapInstance.current.setZoom(16);
      }
      const item = addMarker(place.geometry.location, title);
      if (item) focusMarker(item);
    },
    [addMarker, focusMarker, showPlaceDetails],
  );

  const runSearch = useCallback(() => {
    const query = searchRef.current?.value.trim();
    if (!query) {
      setError("장소나 주소를 입력해 주세요.");
      searchRef.current?.focus();
      return;
    }
    if (!placesServiceRef.current || !mapInstance.current) return;

    closePlacePanel();
    setError(null);
    setSearching(true);
    placesServiceRef.current.findPlaceFromQuery(
      {
        query,
        fields: ["place_id", "geometry", "name", "formatted_address"],
      },
      (results, status) => {
        setSearching(false);
        if (
          status !== google.maps.places.PlacesServiceStatus.OK ||
          !results?.[0]
        ) {
          setError("검색 결과가 없어요. 다른 이름이나 주소로 검색해 주세요.");
          return;
        }
        applyPlaceResult(results[0]);
      },
    );
  }, [applyPlaceResult, closePlacePanel]);

  useEffect(() => {
    if (!ready || !initialQuery || !searchRef.current) return;
    searchRef.current.value = initialQuery;
    runSearch();
  }, [initialQuery, ready, runSearch]);

  useEffect(() => {
    if (!ready || !initialPlaceId || resumedPlaceRef.current === initialPlaceId) {
      return;
    }
    resumedPlaceRef.current = initialPlaceId;
    showPlaceDetails(initialPlaceId);
  }, [initialPlaceId, ready, showPlaceDetails]);

  const guideLocationPermission = useCallback((kind: "site" | "os") => {
    setPermissionHelp({ kind, step: "ask" });
  }, []);

  const locateMe = useCallback(async () => {
    if (!navigator.geolocation || !mapInstance.current) {
      setError("이 브라우저에서는 현재 위치를 찾을 수 없어요.");
      return;
    }

    setError(null);

    try {
      const statusResult = await navigator.permissions?.query({
        name: "geolocation",
      });
      if (statusResult?.state === "denied") {
        guideLocationPermission("site");
        return;
      }
    } catch {
      /* ignore */
    }

    setLocating(true);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const latLng = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        mapInstance.current!.setCenter(latLng);
        mapInstance.current!.setZoom(16);

        if (meMarkerRef.current) {
          meMarkerRef.current.setPosition(latLng);
        } else {
          const rootStyle = getComputedStyle(document.documentElement);
          meMarkerRef.current = new google.maps.Marker({
            position: latLng,
            map: mapInstance.current!,
            title: "내 위치",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: rootStyle.getPropertyValue("--color-accent").trim(),
              fillOpacity: 1,
              strokeColor: rootStyle.getPropertyValue("--color-paper").trim(),
              strokeWeight: 2,
            },
          });
        }

        infoRef.current?.setContent(createInfoLabel("내 위치"));
        infoRef.current?.open({
          map: mapInstance.current!,
          anchor: meMarkerRef.current,
        });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        if (err.code === 1) guideLocationPermission("site");
        else if (err.code === 2) guideLocationPermission("os");
        else if (err.code === 3) {
          setError(
            "위치 확인 시간이 초과됐어요. 내 위치 버튼을 다시 눌러 주세요.",
          );
        } else {
          setError("현재 위치를 찾지 못했어요. 기기의 위치 서비스를 확인해 주세요.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [guideLocationPermission]);

  useEffect(() => {
    if (!apiKey) return;
    if (!mapRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;
    let detailsEl: HTMLElement | null = null;
    const previousAuthFailure = window.gm_authFailure;
    window.gm_authFailure = () => {
      previousAuthFailure?.();
      if (!cancelled) setMapUnavailable(true);
    };

    const handleDetailsError = () => {
      setError("장소 정보를 불러오지 못했어요. 다른 장소를 검색해 주세요.");
      closePlacePanel();
    };

    void (async () => {
      try {
        await loadGoogleMaps(apiKey);
        if (cancelled || !mapRef.current) return;

        const map = new google.maps.Map(mapRef.current, {
          center: SEOUL,
          zoom: 14,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: false,
          cameraControl: false,
          clickableIcons: true,
        });

        mapInstance.current = map;
        infoRef.current = new google.maps.InfoWindow();
        placesServiceRef.current = new google.maps.places.PlacesService(map);

        const resizeMap = () => {
          google.maps.event.trigger(map, "resize");
        };
        resizeMap();
        requestAnimationFrame(resizeMap);

        if (typeof ResizeObserver !== "undefined" && mapRef.current) {
          resizeObserver = new ResizeObserver(() => resizeMap());
          resizeObserver.observe(mapRef.current);
        }

        map.addListener(
          "click",
          (event: google.maps.MapMouseEvent | google.maps.IconMouseEvent) => {
            if ("placeId" in event && event.placeId) {
              event.stop();
              showPlaceDetails(event.placeId, event.latLng);
              return;
            }
            closePlacePanel();
            if (event.latLng) {
              const item = addMarker(
                event.latLng,
                `선택 위치 ${markerSeq.current + 1}`,
              );
              if (item) focusMarker(item);
            }
          },
        );

        if (searchRef.current) {
          const autocomplete = new google.maps.places.Autocomplete(
            searchRef.current,
            {
              fields: ["place_id", "geometry", "name", "formatted_address"],
            },
          );
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            applyPlaceResult(place);
          });
        }

        detailsEl = document.getElementById("placeDetails");
        detailsEl?.addEventListener("gmp-error", handleDetailsError);

        if (!cancelled) {
          setReady(true);
        }
      } catch {
        if (!cancelled) {
          setMapUnavailable(true);
        }
      }
    })();

    return () => {
      cancelled = true;
      if (panTimerRef.current != null) {
        window.clearTimeout(panTimerRef.current);
        panTimerRef.current = null;
      }
      resizeObserver?.disconnect();
      detailsEl?.removeEventListener("gmp-error", handleDetailsError);
      window.gm_authFailure = previousAuthFailure;
      if (mapInstance.current) {
        google.maps.event.clearInstanceListeners(mapInstance.current);
      }
    };
  }, [
    apiKey,
    addMarker,
    applyPlaceResult,
    closePlacePanel,
    focusMarker,
    showPlaceDetails,
  ]);

  const unavailableMessage = !apiKey
    ? "지도 서비스를 준비하고 있어요."
    : !ready && error
      ? error
      : null;

  const directionsHref = selectedPlace
    ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(selectedPlace.name || "선택한 장소")}&destination_place_id=${encodeURIComponent(selectedPlace.id)}&travelmode=walking`
    : null;
  const createTripHref = (() => {
    if (!selectedPlace) return "/trips/new";
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.set("placeId", selectedPlace.id);
    const currentMapHref = `${pathname}?${currentParams.toString()}`;
    const target = new URL(
      withReturnTo("/trips/new", currentMapHref),
      "https://tripdito.local",
    );
    return `${target.pathname}${target.search}`;
  })();

  async function addSelectedPlaceToList() {
    if (!selectedPlace?.name || !activeTrip) return;
    try {
      await createItem.mutateAsync({
        name: selectedPlace.name,
        estimatedPrice: 0,
        quantity: 1,
        memo: `지도에서 저장한 장소 · ${selectedPlace.id}`,
        imageDataUrl: null,
        plannedPurchaseDate:
          getTripHomeMode(activeTrip) === "live" ? todayIsoDate() : null,
        giftTags: [],
      });
      toast.success(`${activeTrip.city} 리스트에 담았어요`);
    } catch {
      toast.error("장소를 담지 못했어요. 다시 시도해 주세요.");
    }
  }

  if (mapUnavailable) {
    return <DemoMapExplorer initialQuery={initialQuery} />;
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-paper-2">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />

      <form
        role="search"
        className="absolute top-3 right-3 left-3 z-10 flex h-12 max-w-md items-center gap-1 rounded-full bg-background p-1 pl-4 shadow-float focus-within:ring-2 focus-within:ring-focus"
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
      >
        <label htmlFor="map-search" className="sr-only">
          장소 검색
        </label>
        <input
          id="map-search"
          ref={searchRef}
          type="search"
          enterKeyHint="search"
          autoComplete="off"
          placeholder="장소나 주소 검색"
          disabled={!ready}
          className="h-11 min-w-0 flex-1 border-0 bg-transparent p-0 text-[15px] text-foreground outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-40"
        />
        <Button
          type="submit"
          size="icon"
          aria-label={searching ? "장소 검색 중" : "장소 검색"}
          aria-busy={searching}
          className="size-11 shrink-0 rounded-full shadow-none"
          disabled={!ready || searching}
        >
          {searching ? (
            <LoaderCircle className="size-5 animate-spin" aria-hidden />
          ) : (
            <Search className="size-5" aria-hidden />
          )}
        </Button>
      </form>

      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label={locating ? "내 위치 확인 중" : "내 위치"}
        aria-busy={locating}
        className={cn(
          "absolute right-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-10 size-12 rounded-full border-border bg-background shadow-float transition-opacity duration-[var(--dur-fast)]",
          placeOpen && "pointer-events-none opacity-0",
        )}
        disabled={!ready || locating}
        onClick={() => void locateMe()}
      >
        {locating ? (
          <LoaderCircle className="size-5 animate-spin text-primary" aria-hidden />
        ) : (
          <LocateFixed className="size-5 text-primary" aria-hidden />
        )}
      </Button>

      <PlaceBottomSheet
        open={placeOpen}
        onClose={closePlacePanel}
        footer={
          selectedPlace ? (
            <div className="flex flex-col gap-3">
              {activeTrip && trips.length > 1 ? (
                <div className="grid grid-cols-[auto_minmax(0,1fr)] items-center gap-3">
                  <label
                    htmlFor="map-save-trip"
                    className="text-[13px] font-semibold text-ink"
                  >
                    저장할 여행
                  </label>
                  <Select
                    items={trips.map((trip) => ({
                      value: trip.id,
                      label: `${trip.startDate} · ${trip.city}`,
                    }))}
                    value={activeTrip.id}
                    disabled={selectActiveTrip.isPending}
                    onValueChange={(tripId) => {
                      if (tripId) selectActiveTrip.mutate(tripId);
                    }}
                  >
                    <SelectTrigger
                      id="map-save-trip"
                      className="w-full"
                      aria-label="장소를 저장할 여행"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {trips.map((trip) => (
                        <SelectItem key={trip.id} value={trip.id}>
                          {trip.startDate} · {trip.city}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : null}
              <div className="flex min-w-0 flex-wrap items-center gap-2 text-[12px] text-ink-2">
                <Link
                  href="/shopping#coupons"
                  className="inline-flex min-h-11 items-center gap-1 rounded-full bg-paper-2 px-3 font-semibold text-accent-text outline-none transition-colors duration-120 hover:bg-paper-3 active:bg-paper-3 active:text-ink focus-visible:ring-2 focus-visible:ring-focus"
                >
                  <Ticket className="size-4" aria-hidden />
                  쿠폰 둘러보기
                </Link>
                <span className="inline-flex min-h-11 items-center gap-1">
                  <Star className="size-4 fill-star text-ink" aria-hidden />
                  {selectedPlace.rating != null
                    ? `별점 ${selectedPlace.rating.toFixed(1)}`
                    : "별점 정보 없음"}
                </span>
                <span className="inline-flex min-h-11 items-center gap-1">
                  <Footprints className="size-4" aria-hidden />
                  도보 시간은 길찾기에서 확인
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {directionsHref ? (
                  <a
                    href={directionsHref}
                    target="_blank"
                    rel="noreferrer"
                    className={buttonVariants({ variant: "outline" })}
                  >
                    Google 길찾기
                    <span aria-hidden>↗</span>
                    <span className="sr-only">새 창</span>
                  </a>
                ) : null}
                {activeTrip ? (
                  <Button
                    type="button"
                    aria-label={`${activeTrip.city} 리스트에 담기`}
                    className="min-w-0"
                    disabled={!selectedPlace.name || createItem.isPending}
                    onClick={() => void addSelectedPlaceToList()}
                  >
                    <span className="min-w-0 truncate">{activeTrip.city}</span>
                    <span className="shrink-0">리스트에 담기</span>
                  </Button>
                ) : selectedPlace.name ? (
                  <Link href={createTripHref} className={buttonVariants()}>
                    여행 만들기
                  </Link>
                ) : (
                  <Button
                    type="button"
                    className="min-w-0 overflow-hidden"
                    aria-label="장소 정보 확인 중"
                    disabled
                  >
                    <span className="min-w-0 truncate">
                      장소 정보 확인 중…
                    </span>
                  </Button>
                )}
              </div>
            </div>
          ) : null
        }
      >
        <gmp-place-details
          id="placeDetails"
          style={
            {
              display: "block",
              width: "100%",
              minHeight: "100%",
              border: "none",
              background: "var(--color-paper)",
              colorScheme: "only light",
              ["--gmp-mat-color-surface" as string]: "var(--color-paper)",
              ["--gmp-mat-color-on-surface" as string]: "var(--color-ink)",
              ["--gmp-mat-color-on-surface-variant" as string]:
                "var(--color-ink-2)",
              ["--gmp-mat-color-primary" as string]: "var(--color-accent)",
            } as React.CSSProperties
          }
        >
          <gmp-place-details-place-request id="placeDetailsRequest" />
          <gmp-place-all-content />
        </gmp-place-details>
      </PlaceBottomSheet>

      {unavailableMessage ? (
        <section
          role="alert"
          className="absolute inset-0 z-20 flex items-center justify-center bg-paper-2 px-6 text-center"
        >
          <div className="flex max-w-xs flex-col items-center">
            <MapPinned
              aria-hidden
              className="mb-4 size-8 text-muted-foreground"
              strokeWidth={1.8}
            />
            <h2 className="text-[22px] leading-snug font-bold tracking-[-0.02em] text-foreground">
              {unavailableMessage}
            </h2>
            <p className="mt-2 text-[15px] leading-6 text-ink-2">
              홈에서 쇼핑리스트는 계속 이용할 수 있어요.
            </p>
            <div className="mt-6 flex w-full flex-col gap-2">
              {apiKey ? (
                <Button
                  type="button"
                  size="lg"
                  onClick={() => window.location.reload()}
                >
                  지도 다시 불러오기
                </Button>
              ) : null}
              <Link
                href="/home"
                className={buttonVariants({
                  variant: apiKey ? "secondary" : "default",
                  size: "lg",
                })}
              >
                홈으로 돌아가기
              </Link>
            </div>
          </div>
        </section>
      ) : error ? (
        <div
          role="status"
          className="absolute right-3 bottom-[max(1rem,env(safe-area-inset-bottom))] left-3 z-20 mx-auto flex max-w-md items-center gap-3 rounded-xl bg-foreground px-4 py-2 text-[13px] leading-5 text-background shadow-float"
        >
          <p className="min-w-0 flex-1">{error}</p>
          <button
            type="button"
            className="min-h-11 shrink-0 rounded-lg px-2 font-semibold underline underline-offset-4 hover:bg-paper/10 active:bg-paper/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-background"
            onClick={() => setError(null)}
          >
            닫기
          </button>
        </div>
      ) : null}

      {permissionHelp ? (
        <AlertDialog
          open
          onOpenChange={(next) => {
            if (!next) setPermissionHelp(null);
          }}
          title="위치 서비스"
          description={
            permissionHelp.step === "ask" ? (
              "내 위치를 찾으려면 위치 접근을 허용해 주세요."
            ) : permissionHelp.kind === "os" ? (
              <span className="block space-y-2 text-left">
                <span className="block text-center">
                  기기의 위치 설정을 확인해 주세요.
                </span>
                <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-2">
                  <li>기기 설정 열기</li>
                  <li>개인정보 또는 위치 설정 열기</li>
                  <li>위치 서비스 켜기</li>
                  <li>이 페이지로 돌아와 내 위치 버튼을 다시 누르기</li>
                </ol>
              </span>
            ) : (
              <span className="block space-y-2 text-left">
                <span className="block text-center">
                  브라우저의 사이트 설정을 확인해 주세요.
                </span>
                <ol className="list-decimal space-y-1 pl-5 text-[13px] text-ink-2">
                  <li>주소창 왼쪽의 사이트 정보 열기</li>
                  <li>사이트 설정 열기</li>
                  <li>위치 → 허용</li>
                  <li>새로고침 후 내 위치 버튼을 다시 누르기</li>
                </ol>
              </span>
            )
          }
          cancelLabel="닫기"
          confirmLabel={
            permissionHelp.step === "ask" ? "설정 방법 보기" : "확인"
          }
          onConfirm={() => {
            if (permissionHelp.step === "ask") {
              setPermissionHelp({
                kind: permissionHelp.kind,
                step: "guide",
              });
              return;
            }
            setPermissionHelp(null);
          }}
        />
      ) : null}
    </div>
  );
}
