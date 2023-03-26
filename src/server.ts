#!/usr/bin/env node
import { Option, program } from 'commander';
import express from 'express';
import consola from 'consola';
import compression from 'compression';
import helmet from 'helmet';

import { version } from './package.json';
import { readLines } from './helpers/files';
import { LocationService } from './core';

program

  .addOption(
    new Option('--key [string]', 'HereAPI key to make the requests')
      .env('HEREAPI_KEY')
      .conflicts('keys')
  )
  .addOption(
    new Option('--keys [string]', 'File containing the HereAPI keys to make the requests')
      .env('HEREAPI_KEYS')
      .conflicts('key')
  )
  .addOption(new Option('-p, --port [number]', 'Port to run the server').env('PORT').default(3000))
  .version(version)
  .action(async () => {
    const options = program.opts();

    if (!options.key && !options.keys)
      program.error('You must provide a HereAPI key (--key) or a keys file (--keys).');

    const service = new LocationService(
      options.keys ? await readLines(options.keys) : options.key ? [options.key] : []
    );

    const app = express();

    app.use(helmet());
    app.use(compression());

    app.get('/location', (req, res) => {
      if (!req.query.q) return res.status(400).send('Missing query parameter ("q").');

      service
        .resolve(req.query.q.toString().trim())
        .then((result) => res.json(result))
        .catch((err) => res.status(500).send(err.message));
    });

    app.listen({ port: options.port }, () => {
      consola.success(`Server running on port ${options.port}`);
    });
  })
  .parseAsync(process.argv);
