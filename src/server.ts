import express from 'express';
import compression from 'compression';
import helmet from 'helmet';

import { LocationService } from './core';

export function app(service: LocationService) {
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

  return app;
}
