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
const axios_1 = __importDefault(require("axios"));
const keyv_1 = __importDefault(require("keyv"));
const lodash_1 = require("lodash");
const os_1 = require("os");
const path_1 = require("path");
const shelljs_1 = require("shelljs");
class LocationResolver {
    constructor(apiKey, version) {
        this.apiKey = apiKey;
        const dir = (0, path_1.resolve)((0, os_1.homedir)(), '.location-resolver');
        (0, shelljs_1.mkdir)('-p', dir);
        this.keyv = new keyv_1.default(`sqlite://${(0, path_1.resolve)(dir, `${version}-db.sqlite`)}`);
    }
    get(location) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv
                .get(location)
                .then((cachedLocation) => {
                return cachedLocation === undefined
                    ? Promise.reject({ notFound: true })
                    : Promise.resolve(cachedLocation);
            })
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                if (error.notFound) {
                    const locationData = yield axios_1.default
                        .get('https://geocode.search.hereapi.com/v1/geocode', {
                        params: { q: location, apiKey: this.apiKey, lang: 'en-US' },
                    })
                        .then((response) => (0, lodash_1.get)(response, 'data.items[0].address', null));
                    yield this.keyv.set(location, locationData);
                    return locationData;
                }
                throw error;
            }));
        });
    }
}
exports.default = LocationResolver;
