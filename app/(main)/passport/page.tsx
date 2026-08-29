import { PassportScreen } from "@/features/profile/components/passport-screen";
import {
  getPassportStampPageNumber,
  getPassportStampTripId,
} from "@/features/profile/utils/passport-view";
import { getSafeReturnTo } from "@/lib/navigation/return-to";

type PassportSearchParams = {
  stampTripId?: string | string[];
  stampPage?: string | string[];
  returnTo?: string | string[];
};

/**
 * 나의 여권 — 완료한 여행을 입국 도장으로 모아 보는 화면.
 * `?stampTripId=`로 진입하면 해당 여행의 도장 찍기 플로우가 시작된다.
 */
export default async function PassportPage({
  searchParams,
}: {
  searchParams: Promise<PassportSearchParams>;
}) {
  const values = await searchParams;
  const stampTripId = getPassportStampTripId(values.stampTripId);
  const stampPageNumber = stampTripId
    ? getPassportStampPageNumber(values.stampPage)
    : null;
  const stampReturnTo = getSafeReturnTo(values.returnTo, "/passport");

  return (
    <PassportScreen
      stampTripId={stampTripId}
      stampPageNumber={stampPageNumber}
      stampReturnTo={stampReturnTo}
    />
  );
}
