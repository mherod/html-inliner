#!/usr/bin/env node

const { transformAll } = require("./index");
const { resolvePath } = require("./util/files/resolve-path");

if (process.argv) {
  const args = process.argv.slice(2);
  const filePath = args.length > 0 ? args[0] : ".";
  const resolvedFilePath = resolvePath(filePath);
  transformAll(resolvedFilePath).then(console.log, console.error);
}
