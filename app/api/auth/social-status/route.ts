import { NextResponse } from "next/server";
import { getConfiguredSocialProviders } from "@/auth";

export async function GET() {
  return NextResponse.json(getConfiguredSocialProviders());
}
