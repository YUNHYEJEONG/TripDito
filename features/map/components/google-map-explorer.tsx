"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { LocateFixed, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AlertDialog } from "@/components/common/alert-dialog";
import { showToastAlert } from "@/components/common/toast-alert";
import { PlaceBottomSheet } from "@/features/map/components/place-bottom-sheet";
import { loadGoogleMaps, SEOUL } from "@/features/map/lib/load-google-maps";
import { cn } from "@/lib/utils";

type MarkerItem = {
  id: string;
  title: string;
  marker: google.maps.Marker;
};

type PlaceRequestElement = HTMLElement & { place: string };

export function GoogleMapExplorer({
  apiKey,
}: {
  apiKey: string;
}) {
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

  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [permissionHelp, setPermissionHelp] = useState<{
    kind: "site" | "os";
    step: "ask" | "guide";
  } | null>(null);

  const closePlacePanel = useCallback(() => {
    setPlaceOpen(false);
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
    ) => {
      const request = document.getElementById(
        "placeDetailsRequest",
      ) as PlaceRequestElement | null;
      if (!request || !mapInstance.current) return;
      setPlaceOpen(true);
      request.place = placeId;

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
        window.setTimeout(() => {
          const h = mapInstance.current?.getDiv().clientHeight ?? 0;
          mapInstance.current?.panBy(0, Math.round(h * 0.18));
        }, 80);
      }
    },
    [],
  );

  const focusMarker = useCallback((item: MarkerItem) => {
    if (!mapInstance.current || !infoRef.current) return;
    mapInstance.current.panTo(item.marker.getPosition()!);
    mapInstance.current.setZoom(Math.max(mapInstance.current.getZoom() || 0, 15));
    infoRef.current.setContent(`<strong>${item.title}</strong>`);
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
        animation: google.maps.Animation.DROP,
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
        showPlaceDetails(place.place_id, place.geometry?.location ?? null);
        if (place.geometry?.viewport) {
          mapInstance.current.fitBounds(place.geometry.viewport);
        }
        return;
      }
      if (!place.geometry?.location) {
        showToastAlert("Google 지도에서 검색결과가 없어요.");
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
      showToastAlert("검색어를 입력해 주세요.");
      return;
    }
    if (!placesServiceRef.current || !mapInstance.current) return;

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
          showToastAlert("Google 지도에서 검색결과가 없어요.");
          return;
        }
        applyPlaceResult(results[0]);
      },
    );
  }, [applyPlaceResult]);

  const guideLocationPermission = useCallback((kind: "site" | "os") => {
    setPermissionHelp({ kind, step: "ask" });
  }, []);

  const locateMe = useCallback(async () => {
    if (!navigator.geolocation || !mapInstance.current) {
      setError("이 브라우저는 현재 위치 기능을 지원하지 않습니다.");
      return;
    }

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
          meMarkerRef.current = new google.maps.Marker({
            position: latLng,
            map: mapInstance.current!,
            title: "내 위치",
            icon: {
              path: google.maps.SymbolPath.CIRCLE,
              scale: 9,
              fillColor: "#2f6fed",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 2,
            },
          });
        }

        infoRef.current?.setContent("<strong>내 위치</strong>");
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
            "위치 요청 시간이 초과되었습니다. 잠시 후 다시 시도해 주세요.",
          );
        } else {
          setError("현재 위치를 가져오지 못했습니다.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }, [guideLocationPermission]);

  useEffect(() => {
    if (!apiKey) {
      setError(
        ".env.local 에 NEXT_PUBLIC_GOOGLE_MAPS_API_KEY 를 설정해 주세요.",
      );
      return;
    }
    if (!mapRef.current) return;

    let cancelled = false;
    let resizeObserver: ResizeObserver | null = null;

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
              componentRestrictions: { country: "kr" },
            },
          );
          autocomplete.bindTo("bounds", map);
          autocomplete.addListener("place_changed", () => {
            const place = autocomplete.getPlace();
            applyPlaceResult(place);
          });
        }

        const detailsEl = document.getElementById("placeDetails");
        detailsEl?.addEventListener("gmp-error", () => {
          setError(
            "Places UI Kit 오류가 발생했습니다. API 사용 설정을 확인해 주세요.",
          );
        });

        if (!cancelled) {
          setReady(true);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : "지도를 초기화하지 못했습니다.",
          );
        }
      }
    })();

    return () => {
      cancelled = true;
      resizeObserver?.disconnect();
    };
  }, [
    apiKey,
    addMarker,
    applyPlaceResult,
    closePlacePanel,
    focusMarker,
    showPlaceDetails,
  ]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-canvas">
      <div ref={mapRef} className="absolute inset-0 h-full w-full" />

      <div className="absolute top-3 right-3 left-3 z-10 flex max-w-md gap-2 sm:left-4 sm:right-auto sm:w-[min(22rem,calc(100%-2rem))]">
        <input
          ref={searchRef}
          type="text"
          placeholder="예: 남산타워, 강남역…"
          disabled={!ready}
          className="h-10 min-w-0 flex-1 rounded-xl border border-border/60 bg-background px-3 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/30 disabled:opacity-50"
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              runSearch();
            }
          }}
        />
        <Button
          type="button"
          size="icon"
          aria-label="검색"
          className="size-10 shrink-0 shadow-sm"
          disabled={!ready || searching}
          onClick={runSearch}
        >
          <Search className="size-5" />
        </Button>
      </div>

      <Button
        type="button"
        size="icon"
        variant="outline"
        aria-label="내 위치"
        className={cn(
          "absolute right-4 bottom-4 z-10 size-11 rounded-full border-border/60 bg-background shadow-md",
          placeOpen && "pointer-events-none opacity-0",
        )}
        disabled={!ready || locating}
        onClick={() => void locateMe()}
      >
        <LocateFixed className="size-5 text-primary" />
      </Button>

      <PlaceBottomSheet open={placeOpen} onClose={closePlacePanel}>
        <gmp-place-details
          id="placeDetails"
          style={
            {
              display: "block",
              width: "100%",
              minHeight: "100%",
              border: "none",
              background: "#fff",
              colorScheme: "only light",
              ["--gmp-mat-color-surface" as string]: "#ffffff",
              ["--gmp-mat-color-on-surface" as string]: "#1a1a1a",
              ["--gmp-mat-color-on-surface-variant" as string]: "#3c4043",
              ["--gmp-mat-color-primary" as string]: "#1a73e8",
            } as React.CSSProperties
          }
        >
          <gmp-place-details-place-request id="placeDetailsRequest" />
          <gmp-place-all-content />
        </gmp-place-details>
      </PlaceBottomSheet>

      {error ? (
        <p className="absolute bottom-20 left-1/2 z-20 max-w-md -translate-x-1/2 rounded-xl bg-destructive/95 px-4 py-3 text-sm text-white shadow-lg">
          {error}
          <button
            type="button"
            className="ml-3 underline"
            onClick={() => setError(null)}
          >
            닫기
          </button>
        </p>
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
              "위치 서비스를 허용해주세요."
            ) : permissionHelp.kind === "os" ? (
              <span className="block space-y-2 text-left">
                <span className="block text-center">
                  Windows 위치 설정을 확인해 주세요.
                </span>
                <ol className="list-decimal space-y-1 pl-5 text-[13px] text-[#3C4043]">
                  <li>Windows 설정 열기</li>
                  <li>개인 정보 보호 → 위치</li>
                  <li>위치 서비스 켜기</li>
                  <li>이 페이지로 돌아와 내 위치 버튼을 다시 누르기</li>
                </ol>
              </span>
            ) : (
              <span className="block space-y-2 text-left">
                <span className="block text-center">
                  브라우저는 사이트 설정으로 자동 이동할 수 없습니다.
                </span>
                <ol className="list-decimal space-y-1 pl-5 text-[13px] text-[#3C4043]">
                  <li>주소창 왼쪽 자물쇠(또는 ⓘ) 클릭</li>
                  <li>사이트 설정 열기</li>
                  <li>위치 → 허용</li>
                  <li>새로고침 후 내 위치 버튼을 다시 누르기</li>
                </ol>
              </span>
            )
          }
          cancelLabel="닫기"
          confirmLabel="확인"
          onConfirm={() => {
            if (permissionHelp.step === "ask") {
              if (permissionHelp.kind === "os") {
                window.open("ms-settings:privacy-location", "_blank");
              }
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
