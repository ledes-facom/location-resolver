"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
const express_1 = __importDefault(require("express"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
function app(service) {
    const app = (0, express_1.default)();
    app.use((0, helmet_1.default)());
    app.use((0, compression_1.default)());
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
