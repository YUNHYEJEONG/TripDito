import { appConfig } from "@/config/app";
import type { TripFormValues } from "./schema";

export const defaultTripFormValues: TripFormValues = {
  name: "",
  country: "",
  city: "",
  startDate: "",
  endDate: "",
  currency: appConfig.defaultCurrency,
  budget: 0,
  tripTags: [],
};
