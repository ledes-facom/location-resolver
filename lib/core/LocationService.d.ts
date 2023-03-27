import { HereApiResponse } from '../types';
export default class LocationService {
    private cache;
    private keys;
    private queues;
    private balancer;
    constructor(apiKey: string | string[]);
    resolve(location: string): Promise<HereApiResponse | null>;
}
