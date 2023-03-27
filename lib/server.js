#!/usr/bin/env node
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const express_1 = __importDefault(require("express"));
const consola_1 = __importDefault(require("consola"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const package_json_1 = require("./package.json");
const files_1 = require("./helpers/files");
const core_1 = require("./core");
commander_1.program
    .addOption(new commander_1.Option('--key [string]', 'HereAPI key to make the requests')
    .env('HEREAPI_KEY')
    .conflicts('keys'))
    .addOption(new commander_1.Option('--keys [string]', 'File containing the HereAPI keys to make the requests')
    .env('HEREAPI_KEYS')
    .conflicts('key'))
    .addOption(new commander_1.Option('-p, --port [number]', 'Port to run the server').env('PORT').default(3000))
    .version(package_json_1.version)
    .action(() => __awaiter(void 0, void 0, void 0, function* () {
    const options = commander_1.program.opts();
    if (!options.key && !options.keys)
        commander_1.program.error('You must provide a HereAPI key (--key) or a keys file (--keys).');
    const service = new core_1.LocationService(options.keys ? yield (0, files_1.readLines)(options.keys) : options.key ? [options.key] : []);
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
    app.listen({ port: options.port }, () => {
        consola_1.default.success(`Server running on port ${options.port}`);
    });
}))
    .parseAsync(process.argv);
