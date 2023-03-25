import { HereApiResponse } from './helpers';
export default class LocationResolver {
    private apiKey;
    private readonly keyv;
    constructor(apiKey: string, version: string);
    get(location: string): Promise<HereApiResponse | null>;
}
