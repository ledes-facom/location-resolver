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
const fs_1 = require("fs");
const keyv_1 = __importDefault(require("keyv"));
const os_1 = require("os");
const path_1 = __importDefault(require("path"));
const package_json_1 = require("../package.json");
class LocationCache {
    constructor() {
        const dir = path_1.default.resolve((0, os_1.homedir)(), '.location-resolver');
        (0, fs_1.mkdirSync)(dir, { recursive: true });
        this.keyv = new keyv_1.default(`sqlite://${path_1.default.resolve(dir, `${package_json_1.version}-db.sqlite`)}`);
    }
    static getInstance() {
        if (!this.instance)
            this.instance = new this();
        return this.instance;
    }
    get(location) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.keyv.get(location);
        });
    }
    set(key, location) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.keyv.set(key, location);
        });
    }
}
exports.default = LocationCache;
