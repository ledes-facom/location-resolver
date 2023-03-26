import axios from 'axios';
import { P2cBalancer } from 'load-balancers';
import { get } from 'lodash';
import PQueue from 'p-queue';
import { HereApiResponse } from '../types';
import LocationCache from './LocationCache';

export default class LocationService {
  private cache = LocationCache.getInstance();

  private keys: string[];
  private queues: Array<PQueue>;
  private balancer: P2cBalancer;

  constructor(apiKey: string | string[]) {
    this.keys = Array.isArray(apiKey) ? apiKey : [apiKey];
    this.balancer = new P2cBalancer(this.keys.length);
    this.queues = this.keys.map(() => new PQueue({ concurrency: 1 }));
  }

  public async resolve(location: string): Promise<HereApiResponse | null> {
    const index = this.balancer.pick();
    return this.queues[index].add(() =>
      this.cache
        .get(location)
        .then((cachedLocation) =>
          cachedLocation === undefined
            ? // eslint-disable-next-line prefer-promise-reject-errors
              Promise.reject({ notFound: true })
            : Promise.resolve(cachedLocation)
        )
        .catch(async (error) => {
          if (error.notFound) {
            const locationData: HereApiResponse = await axios
              .get('https://geocode.search.hereapi.com/v1/geocode', {
                params: { q: location, apiKey: this.keys[index], lang: 'en-US' },
              })
              .then((response) => get(response, 'data.items[0].address', null));

            await this.cache.set(location, locationData);

            return locationData;
          }

          throw error;
        })
    );
  }
}
