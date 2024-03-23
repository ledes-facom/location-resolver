import { mkdirSync } from 'fs';
import Keyv from 'keyv';
import { homedir } from 'os';
import path from 'path';
import { version } from '../package.json';
import { HereApiResponse } from '../types';

export default class LocationCache {
  private static instance?: LocationCache;
  private keyv: Keyv<HereApiResponse | null>;

  private constructor() {
    const dir = path.resolve(homedir(), '.location-resolver');
    mkdirSync(dir, { recursive: true });
    this.keyv = new Keyv<HereApiResponse | null>(
      `sqlite://${path.resolve(dir, `${version}-db.sqlite`)}`,
    );
  }

  static getInstance() {
    this.instance ||= new this();
    return this.instance;
  }

  async get(location: string) {
    return this.keyv.get(location);
  }

  async set(key: string, location: HereApiResponse | null) {
    await this.keyv.set(key, location);
  }
}
