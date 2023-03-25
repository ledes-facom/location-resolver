#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { shuffle } from 'lodash';
import * as csv from 'fast-csv';
import consola from 'consola';
import { Argument, Option, program } from 'commander';
import cliProgress from 'cli-progress';
import { each } from 'bluebird';
import { readCSV, readTXT } from './helpers';

import { version } from './package.json';
import LocationResolver from './resolver';

program
  .addArgument(new Argument('<input_file>', 'File containing the locations (.csv or .txt)'))
  .addOption(new Option('-o, --output [string]', 'Output file to save results'))
  .addOption(
    new Option('--api-key [string]', 'HereAPI key to make the requests')
      .env('HEREAPI_KEY')
      .makeOptionMandatory()
  )
  .addOption(new Option('--shuffle', 'Shuffle location entries before execution'))
  .version(version)
  .action(async (inputFile: string) => {
    // Obtem as opções passadas pela linha de comando
    const options = program.opts<{ apiKey: string; shuffle: boolean; output?: string }>();

    // Faz a leitura do arquivo csv com os dados
    consola.debug(`Reading csv file (${inputFile}) ...`);
    const readFn = inputFile.endsWith('.csv') ? readCSV : readTXT;

    return readFn(path.resolve(__dirname, inputFile))
      .then((locations) => locations.map((l) => l.location.trim()).filter((l) => l.length > 0)) // Faz a limpeza da localicações (e.g., remove espaços dos cantos)
      .then((locations) => (options.shuffle ? shuffle(locations) : locations))
      .then(async (locations) => {
        consola.debug(`Preparing to resolve ${locations.length} locales ...`);

        consola.debug('Preparing locales resolver ...');
        const resolver = new LocationResolver(options.apiKey, version);

        // Cria o csv stream
        const csvStream = csv.format({
          headers: [
            'location',
            'label',
            'countryCode',
            'countryName',
            'stateCode',
            'state',
            'county',
            'city',
          ],
          quoteColumns: true,
        });

        consola.debug(`Piping output to ${options.output ? 'file' : 'stdout'} ...`);
        csvStream
          .pipe(
            options.output
              ? fs.createWriteStream(path.resolve(__dirname, options.output))
              : process.stdout
          )
          .on('end', () => process.exit());

        const bar = new cliProgress.SingleBar(
          {
            format:
              'Progress [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | "{location}"',
          },
          cliProgress.Presets.shades_classic
        );

        if (options.output && !process.env.DEBUG) bar.start(locations.length, 0);

        // Itera sobre cada localização esperando cada Promise ser resolvida
        return each(locations, async (location) => {
          consola.debug(`Resolving location "${location}" ...`);

          // Recupera a localização no serviço
          return resolver
            .get(location)
            .catch((error) => (error?.response?.status === 400 ? null : Promise.reject(error)))
            .then((response) => csvStream.write({ location, ...response }))
            .finally(() => bar.increment({ location }));
        })
          .then(() => new Promise((resolve) => csvStream.end(resolve)))
          .then(() => process.stdout.write('\n'))
          .then(() => consola.debug('Done.'))
          .finally(() => bar.stop())
          .catch(consola.error);
      });
  })
  .parse(process.argv);
