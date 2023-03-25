import axios from 'axios';
import Keyv from 'keyv';
import { get } from 'lodash';
import { homedir } from 'os';
import { resolve } from 'path';
import { HereApiResponse } from './helpers';
import { mkdir } from 'shelljs';

export default class LocationResolver {
  private readonly keyv: Keyv<HereApiResponse | null>;

  constructor(private apiKey: string, version: string) {
    const dir = resolve(homedir(), '.location-resolver');
    mkdir('-p', dir);
    this.keyv = new Keyv<HereApiResponse | null>(
      `sqlite://${resolve(dir, `${version}-db.sqlite`)}`
    );
  }

  public async get(location: string): Promise<HereApiResponse | null> {
    return this.keyv
      .get(location)
      .then((cachedLocation) => {
        return cachedLocation === undefined
          ? Promise.reject({ notFound: true })
          : Promise.resolve(cachedLocation);
      })
      .catch(async (error) => {
        if (error.notFound) {
          const locationData: HereApiResponse = await axios
            .get('https://geocode.search.hereapi.com/v1/geocode', {
              params: { q: location, apiKey: this.apiKey, lang: 'en-US' },
            })
            .then((response) => get(response, 'data.items[0].address', null));

          await this.keyv.set(location, locationData);

          return locationData;
        }

        throw error;
      });
  }
}
