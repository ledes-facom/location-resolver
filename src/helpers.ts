/**
 * Author: Hudson Silva Borges
 */
import fs from 'fs';
import * as csv from 'fast-csv';

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

/**
 * Função responsável pela leitura do arquivo CSV.
 * É necessário que tenha duas colunas: 'count' e 'location'
 */
export async function readCSV(file: string): Promise<LocationData> {
  const result: LocationData = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .pipe(csv.parse({ headers: true }))
      .on('error', (error) => reject(error))
      .on('data', (row) => result.push({ count: parseInt(row.count, 10), location: row.location }))
      .on('end', () => resolve(result));
  });
}

/**
 * Função responsável pela leitura do arquivo TXT.
 * Cada linha do arquivo representa uma localização.
 */
export async function readTXT(file: string): Promise<LocationData> {
  const result: LocationData = [];

  return new Promise((resolve, reject) => {
    fs.createReadStream(file)
      .on('data', (data) =>
        result.push(
          ...data
            .toString()
            .split('\n')
            .map((l) => ({ location: l.trim() }))
        )
      )
      .on('error', (error) => reject(error))
      .on('end', () => resolve(result));
  });
}
