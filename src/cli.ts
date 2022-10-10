#!/usr/bin/env node

import { argvOptions } from "./argv";
import { blue, yellow } from "colorette";
import { transformAll } from "./transformAll";
import { resolvePath } from "./util/files/resolve-path";

for (const arg of argvOptions._) {
  const resolvedPath = resolvePath(arg);
  console.log(
    blue(`Transforming files in`), yellow(resolvedPath));
  transformAll(resolvedPath).then(console.log, console.error);
}
