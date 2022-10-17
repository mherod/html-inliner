import minimist from "minimist";
import { merge } from "lodash";

const defaultOpts = {
  "inline-images": true,
  "inline-styles": true,
  "inline-js": false,
  "inline-fonts": false
};

const argv = process.argv ?? [];

export const argvOptions = merge(defaultOpts, minimist(argv.slice(2)));
