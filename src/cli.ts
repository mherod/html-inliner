#!/usr/bin/env node

import { argvOptions } from "./argv";
import { blue, yellow } from "colorette";
import { transformAll } from "./transformAll";
import { resolvePath } from "./util/files/resolve-path";

console.log(argvOptions);

const paths = argvOptions._;

for (const path of paths) {
  const resolvedPath = resolvePath(path);
  console.log(
    blue(`Transforming files in`), yellow(resolvedPath));
  transformAll(resolvedPath).then(console.log, console.error);
}
