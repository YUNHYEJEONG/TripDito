import { redirect } from "next/navigation";

/** 기존 북마크와 상세 화면의 복귀 경로를 새 여행 허브로 연결한다. */
export default function MyTripsPage() {
  redirect("/passport");
}
