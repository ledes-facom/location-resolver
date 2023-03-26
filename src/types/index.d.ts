export type LocationData = Array<{
  location: string;
  count?: number;
}>;

export type HereApiResponse = {
  label: string;
  countryCode: string;
  countryName: string;
  stateCode: string;
  state: string;
  city: string;
  postalCode: string;
};
