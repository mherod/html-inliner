import minimist from "minimist";

export const argv: string[] = process.argv ?? [];

export const argvOptions = minimist(argv.slice(2));
