#!/usr/bin/env node
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
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
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const lodash_1 = require("lodash");
const csv = __importStar(require("fast-csv"));
const consola_1 = __importDefault(require("consola"));
const commander_1 = require("commander");
const cli_progress_1 = __importDefault(require("cli-progress"));
const bluebird_1 = require("bluebird");
const helpers_1 = require("./helpers/helpers");
const load_balancers_1 = require("load-balancers");
const package_json_1 = require("./package.json");
const LocationResolver_1 = __importDefault(require("./core/LocationResolver"));
commander_1.program
    .addArgument(new commander_1.Argument('<input_file>', 'File containing the locations (.csv or .txt)'))
    .addOption(new commander_1.Option('-o, --output [string]', 'Output file to save results'))
    .addOption(new commander_1.Option('--key [string]', 'HereAPI key to make the requests')
    .env('HEREAPI_KEY')
    .conflicts('keys'))
    .addOption(new commander_1.Option('--keys [string]', 'File containing the HereAPI keys to make the requests')
    .env('HEREAPI_KEYS')
    .conflicts('key'))
    .addOption(new commander_1.Option('--shuffle', 'Shuffle location entries before execution'))
    .version(package_json_1.version)
    .action((inputFile) => __awaiter(void 0, void 0, void 0, function* () {
    const options = commander_1.program.opts();
    if (!options.key && !options.keys)
        commander_1.program.error('You must provide a HereAPI key (--key) or a keys file (--keys).');
    const keys = options.keys ? yield (0, helpers_1.readLines)(options.keys) : options.key ? [options.key] : [];
    const balancer = new load_balancers_1.P2cBalancer(keys.length);
    consola_1.default.debug(`Reading csv file (${inputFile}) ...`);
    const readFn = inputFile.endsWith('.csv') ? helpers_1.readCSV : helpers_1.readTXT;
    return readFn(path_1.default.resolve(__dirname, inputFile))
        .then((locations) => locations.map((l) => l.location.trim()).filter((l) => l.length > 0))
        .then((locations) => (options.shuffle ? (0, lodash_1.shuffle)(locations) : locations))
        .then((locations) => __awaiter(void 0, void 0, void 0, function* () {
        consola_1.default.debug(`Preparing to resolve ${locations.length} locales ...`);
        consola_1.default.debug('Preparing locales resolver ...');
        const resolvers = keys.map((key) => new LocationResolver_1.default(key));
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
        consola_1.default.debug(`Piping output to ${options.output ? 'file' : 'stdout'} ...`);
        csvStream
            .pipe(options.output
            ? fs_1.default.createWriteStream(path_1.default.resolve(__dirname, options.output))
            : process.stdout)
            .on('end', () => process.exit());
        const bar = new cli_progress_1.default.SingleBar({
            format: 'Progress [{bar}] {percentage}% | ETA: {eta_formatted} | {value}/{total} | "{location}"',
        }, cli_progress_1.default.Presets.shades_classic);
        if (options.output && !process.env.DEBUG)
            bar.start(locations.length, 0);
        return (0, bluebird_1.map)(locations, (location) => __awaiter(void 0, void 0, void 0, function* () {
            consola_1.default.debug(`Resolving location "${location}" ...`);
            return resolvers[balancer.pick()]
                .get(location)
                .catch((error) => { var _a; return (((_a = error === null || error === void 0 ? void 0 : error.response) === null || _a === void 0 ? void 0 : _a.status) === 400 ? null : Promise.reject(error)); })
                .then((response) => csvStream.write(Object.assign({ location }, response)))
                .finally(() => bar.increment({ location }));
        }))
            .then(() => csvStream.end())
            .then(() => process.stdout.write('\n'))
            .then(() => consola_1.default.debug('Done.'))
            .finally(() => bar.stop())
            .catch(consola_1.default.error);
    }));
}))
    .parseAsync(process.argv);
