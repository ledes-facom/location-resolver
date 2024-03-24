"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const swagger_ui_express_1 = __importDefault(require("swagger-ui-express"));
const swagger_jsdoc_1 = __importDefault(require("swagger-jsdoc"));
const package_json_1 = require("./package.json");
function app(service) {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
    const specs = (0, swagger_jsdoc_1.default)({
        definition: {
            openapi: '3.1.0',
            info: {
                title: 'Location API',
                version: package_json_1.version,
                description: 'API para resolução de localizações de usuários do GitHub',
            },
        },
        apis: ['src/server.ts'],
    });
    app.use('/api-docs', swagger_ui_express_1.default.serve, swagger_ui_express_1.default.setup(specs));
    app.get('/location', (req, res) => {
        if (!req.query.q)
            return res.status(400).send('Missing query parameter ("q").');
        service
            .resolve(req.query.q.toString().trim())
            .then((result) => res.json(result))
            .catch((err) => res.status(500).send(err.message));
    });
    return app;
}
exports.app = app;
