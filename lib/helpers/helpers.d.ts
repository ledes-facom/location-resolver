import { LocationData } from '../types';
export declare function readCSV(file: string): Promise<LocationData>;
export declare function readLines(file: string): Promise<string[]>;
export declare function readTXT(file: string): Promise<LocationData>;
