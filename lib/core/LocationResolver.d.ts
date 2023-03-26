import { HereApiResponse } from '../types';
export default class LocationResolver {
    private apiKey;
    private cache;
    private queue;
    constructor(apiKey: string);
    get(location: string): Promise<HereApiResponse | null>;
}
