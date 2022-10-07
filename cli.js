#!/usr/bin/env node

import { argv } from "./argv";

const { transformAll } = require("./index");
const { resolvePath } = require("./util/files/resolve-path");

if (argv) {
  console.log("argv", argv);
  const args = argv.slice(2);
  const filePath = args.length > 0 ? args[0] : ".";
  const resolvedFilePath = resolvePath(filePath);
  transformAll(resolvedFilePath).then(console.log, console.error);
}
