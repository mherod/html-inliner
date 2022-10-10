#!/usr/bin/env node

import { argvOptions } from "./argv";
import { blue } from "colorette";

const { transformAll } = require("./index");
const { resolvePath } = require("./util/files/resolve-path");

for (const arg of argvOptions._) {
  const resolvedPath = resolvePath(arg);
  console.log(blue(`Transforming files in ${resolvedPath}`));
  transformAll(resolvedPath).then(console.log, console.error);
}
