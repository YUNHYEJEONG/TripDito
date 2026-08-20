import { PassportHub } from "@/features/profile/components/passport-hub";
import {
  getPassportStampPageNumber,
  getPassportStampTripId,
  getPassportView,
} from "@/features/profile/utils/passport-view";
import { getSafeReturnTo } from "@/lib/navigation/return-to";

type PassportSearchParams = {
  view?: string | string[];
  stampTripId?: string | string[];
  stampPage?: string | string[];
  returnTo?: string | string[];
};

export default async function PassportPage({
  searchParams,
}: {
  searchParams: Promise<PassportSearchParams>;
}) {
  const values = await searchParams;
  const activeView = getPassportView(values.view);
  const stampTripId =
    activeView === "stamps"
      ? getPassportStampTripId(values.stampTripId)
      : null;
  const stampPageNumber = stampTripId
    ? getPassportStampPageNumber(values.stampPage)
    : null;
  const stampReturnTo = getSafeReturnTo(
    values.returnTo,
    "/passport?view=stamps",
  );

  return (
    <PassportHub
      activeView={activeView}
      stampTripId={stampTripId}
      stampPageNumber={stampPageNumber}
      stampReturnTo={stampReturnTo}
    />
  );
}
