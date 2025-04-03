import type { Options, OptionsReader } from "../index.js";
import { type Logger } from "#utils";
/**
 * Obtains option values from command-line arguments
 */
export declare class ArgumentsReader implements OptionsReader {
    readonly name = "arguments";
    readonly order: number;
    readonly supportsPackages = false;
    private args;
    constructor(priority: number, args?: string[]);
    read(container: Options, logger: Logger): void;
}
