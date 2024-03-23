#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { shuffle } from 'lodash';
import * as csv from 'fast-csv';
import consola from 'consola';
import { Argument, Option, program } from 'commander';
import cliProgress from 'cli-progress';
import { map } from 'bluebird';
import { readCSV, readLines, readTXT } from './helpers/files';

import { version } from './package.json';
import LocationService from './core/LocationService';
import { app } from './server';

program
  .addArgument(new Argument('[input_file]', 'File containing the locations (.csv or .txt)'))
  .addOption(new Option('-s, --server', 'Starts the server mode'))
  .addOption(new Option('--port [number]', 'Port to start the server').env('PORT').default(3000))
  .addOption(new Option('-o, --output [string]', 'Output file to save results'))
  .addOption(
    new Option('--key [string]', 'HereAPI key to make the requests')
      .env('HEREAPI_KEY')
      .conflicts('keys'),
  )
  .addOption(
    new Option('--keys [string]', 'File containing the HereAPI keys to make the requests')
      .env('HEREAPI_KEYS')
      .conflicts('key'),
  )
  .addOption(new Option('--shuffle', 'Shuffle location entries before execution'))
  .version(version)
  .action(async (inputFile: string) => {
    // Obtem as opções passadas pela linha de comando
    const options = program.opts<
      { key?: string; keys?: string } & (
        | { server: true; port: number }
        | { server: false; shuffle: boolean; output?: string }
      ) &
        ({ key: string } | { keys: string })
    >();

    if (!options.key && !options.keys)
      program.error('You must provide a HereAPI key (--key) or a keys file (--keys).');

    consola.debug('Preparing locales resolver ...');
    const service = new LocationService(
      options.keys ? await readLines(options.keys) : options.key ? [options.key] : [],
    );

    if (options.server) {
      consola.debug('Starting server ...');
      const server = app(service).listen(options.port, () =>
        consola.info(`Server started at port :${options.port}`),
      );

      return new Promise<void>((resolve, reject) => {
        server.on('close', (err: unknown) => (err ? reject(err) : resolve()));
      });
    }

    // Faz a leitura do arquivo csv com os dados
    consola.debug(`Reading csv file (${inputFile}) ...`);
    const readFn = inputFile.endsWith('.csv') ? readCSV : readTXT;

    return readFn(path.resolve(__dirname, inputFile))
      .then((locations) => locations.map((l) => l.location.trim()).filter((l) => l.length > 0)) // Faz a limpeza da localicações (e.g., remove espaços dos cantos)
      .then((locations) => (options.shuffle ? shuffle(locations) : locations))
      .then(async (locations) => {
        consola.debug(`Preparing to resolve ${locations.length} locales ...`);

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
              : process.stdout,
          )
          .on('end', () => process.exit());

        const bar = new cliProgress.SingleBar(
          {
            format:
              'Progress [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | "{location}"',
          },
          cliProgress.Presets.shades_classic,
        );

        if (options.output && !process.env.DEBUG) bar.start(locations.length, 0);

        // Itera sobre cada localização esperando cada Promise ser resolvida
        return map(locations, async (location) => {
          consola.debug(`Resolving location "${location}" ...`);

          // Recupera a localização no serviço
          return service
            .resolve(location)
            .catch((error) => (error?.response?.status === 400 ? null : Promise.reject(error)))
            .then((response) => csvStream.write({ location, ...response }))
            .finally(() => bar.increment({ location }));
        })
          .then(() => csvStream.end())
          .then(() => process.stdout.write('\n'))
          .then(() => consola.debug('Done.'))
          .finally(() => bar.stop())
          .catch(consola.error);
      });
  })
  .parseAsync(process.argv);
