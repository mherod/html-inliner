import { tidyPath } from "./tidy-path";
import * as path from "path";

export function resolvePath(pathSegments: string) {
  return tidyPath(path.resolve(pathSegments));
}
