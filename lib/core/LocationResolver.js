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
const lodash_1 = require("lodash");
const p_queue_1 = __importDefault(require("p-queue"));
const LocationCache_1 = __importDefault(require("./LocationCache"));
class LocationResolver {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.cache = LocationCache_1.default.getInstance();
        this.queue = new p_queue_1.default({ concurrency: 1 });
    }
    get(location) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.queue.add(() => this.cache
                .get(location)
                .then((cachedLocation) => cachedLocation === undefined
                ?
                    Promise.reject({ notFound: true })
                : Promise.resolve(cachedLocation))
                .catch((error) => __awaiter(this, void 0, void 0, function* () {
                if (error.notFound) {
                    const locationData = yield axios_1.default
                        .get('https://geocode.search.hereapi.com/v1/geocode', {
                        params: { q: location, apiKey: this.apiKey, lang: 'en-US' },
                    })
                        .then((response) => (0, lodash_1.get)(response, 'data.items[0].address', null));
                    yield this.cache.set(location, locationData);
                    return locationData;
                }
                throw error;
            })));
        });
    }
}
exports.default = LocationResolver;
