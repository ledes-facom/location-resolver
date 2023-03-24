/**
 * Author: Hudson Silva Borges
 */
import fs from 'fs';
import { get } from 'lodash';
import axios from 'axios';
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
 *
 * @param {String} file Caminho do arquivo .csv
 * @returns {Promise<Array<{ count: number; location: string }>>} Uma lista de strings com os locais
 *
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
 *
 * @param file Caminho do arquivo .txt
 * @returns Uma lista de strings com os locais
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

/**
 * Função para resolver uma localização qualquer usando do HereAPI.
 *
 * @param {string} location Um texto que represente a localização que desejamos resolver
 * @param {string} apiKey Chave de acesso fornecida pela HereAPI
 * @returns {Promise<any>} retorna um objeto contendo os dados da localização ou 'undefined' se não encontrado
 */
export async function resolveLocation(
  location: string,
  apiKey: string
): Promise<HereApiResponse | null> {
  return axios
    .get('https://geocode.search.hereapi.com/v1/geocode', {
      params: { q: location, apiKey, lang: 'en-US' },
    })
    .then((response) => get(response, 'data.items[0].address', null));
}
