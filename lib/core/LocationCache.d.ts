import { HereApiResponse } from '../types';
export default class LocationCache {
    private static instance?;
    private keyv;
    private constructor();
    static getInstance(): LocationCache;
    get(location: string): Promise<HereApiResponse | null | undefined>;
    set(key: string, location: HereApiResponse | null): Promise<void>;
}
