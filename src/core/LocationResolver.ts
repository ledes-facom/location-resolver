import axios from 'axios';
import { get } from 'lodash';
import PQueue from 'p-queue';
import { HereApiResponse } from '../types';
import LocationCache from './LocationCache';

export default class LocationResolver {
  private cache = LocationCache.getInstance();
  private queue: PQueue;

  constructor(private apiKey: string) {
    this.queue = new PQueue({ concurrency: 1 });
  }

  public async get(location: string): Promise<HereApiResponse | null> {
    return this.queue.add(() =>
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
                params: { q: location, apiKey: this.apiKey, lang: 'en-US' },
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
