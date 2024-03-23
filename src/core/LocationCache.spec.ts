import { existsSync } from 'fs';
import LocationCache from './LocationCache';

import { dirSync } from 'tmp-promise';
import { resolve } from 'path';
import { homedir } from 'os';

jest.mock('os', () => {
  const originalModule = jest.requireActual('os');
  return {
    ...originalModule,
    homedir: jest.fn(),
  };
});

describe('LocationCache', () => {
  const tmpDir: ReturnType<typeof dirSync> = dirSync({ unsafeCleanup: true });

  process.on('exit', () => tmpDir.removeCallback());

  const sample = {
    city: 'São Paulo',
    countryCode: 'BR',
    countryName: 'Brazil',
    label: 'São Paulo, Brazil',
    state: 'SP',
    postalCode: '01000-000',
    stateCode: '27',
  };

  beforeAll(() => {
    (homedir as jest.Mock).mockReturnValue(tmpDir.name);
    LocationCache.getInstance();
  });

  it('should create database if not exists', () => {
    expect(existsSync(tmpDir.name)).toBe(true);
    expect(existsSync(resolve(tmpDir.name, '.location-resolver'))).toBe(true);
  });

  it('should return aways the same instance (Singleton pattern)', () => {
    expect(LocationCache.getInstance()).toBe(LocationCache.getInstance());
  });

  it('should return undefined if key is not found', async () => {
    expect(await LocationCache.getInstance().get(sample.label)).toBeUndefined();
  });

  it('should set and get a value', async () => {
    await expect(LocationCache.getInstance().set(sample.label, sample)).resolves.toBeUndefined();
    await expect(LocationCache.getInstance().get(sample.label)).resolves.toEqual(sample);
  });

  it('should replace entry if key already exists', async () => {
    const newSample = { ...sample, city: 'Rio de Janeiro' };
    await expect(LocationCache.getInstance().set(sample.label, newSample)).resolves.toBeUndefined();
    await expect(LocationCache.getInstance().get(sample.label)).resolves.toEqual(newSample);
  });
});
