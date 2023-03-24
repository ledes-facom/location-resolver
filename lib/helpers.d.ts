type LocationData = Array<{
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
export declare function readCSV(file: string): Promise<LocationData>;
export declare function readTXT(file: string): Promise<LocationData>;
export declare function resolveLocation(location: string, apiKey: string): Promise<HereApiResponse | null>;
export {};
