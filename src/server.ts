import express from 'express';
import compression from 'compression';
import helmet from 'helmet';
import swaggerUi from 'swagger-ui-express';
import swaggerJsdoc from 'swagger-jsdoc';

import { LocationService } from './core';
import { version } from './package.json';

/**
 * @swagger
 * components:
 *   schemas:
 *     HereApiResponse:
 *       type: object
 *       required:
 *         - label
 *       properties:
 *         label:
 *           type: string
 *           description: Nome da localização
 *         countryCode:
 *           type: string
 *           description: Código do país
 *         countryName:
 *           type: string
 *           description: Nome do país
 *         stateCode:
 *           type: string
 *           description: Código do estado
 *         state:
 *           type: string
 *           description: Nome do estado
 *         city:
 *           type: string
 *           description: Nome da cidade
 *         postalCode:
 *           type: string
 *           description: Código postal
 *       example:
 *        label: "São Paulo, SP, Brasil"
 *        countryCode: "BRA"
 *        countryName: "Brasil"
 *        stateCode: "SP"
 *        state: "São Paulo"
 *        city: "São Paulo"
 *        postalCode: "01000-000"
 */
export function app(service: LocationService) {
  const app = express();

  app.use(helmet());
  app.use(compression());

  const specs = swaggerJsdoc({
    definition: {
      openapi: '3.1.0',
      info: {
        title: 'Location API',
        version,
        description: 'API para resolução de localizações de usuários do GitHub',
      },
    },
    apis: ['src/server.ts'],
  });
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(specs));

  /**
   * @swagger
   * /location:
   *   get:
   *     summary: Resolve uma localização
   *     description: Retorna informações sobre uma localização
   *     parameters:
   *       - in: query
   *         name: q
   *         required: true
   *         description: Localização a ser resolvida
   *         schema:
   *           type: string
   *     responses:
   *       200:
   *         description: Localização resolvida
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/HereApiResponse'
   *       400:
   *         description: Parâmetro "q" não informado
   *       500:
   *         description: Erro ao resolver a localização
   */
  app.get('/location', (req, res) => {
    if (!req.query.q) return res.status(400).send('Missing query parameter ("q").');

    service
      .resolve(req.query.q.toString().trim())
      .then((result) => res.json(result))
      .catch((err) => res.status(500).send(err.message));
  });

  return app;
}
