import { transform } from "./transform";
import { walkDirectory } from "./util/files/walk-directory";
import { resolvePath } from "./util/files/resolve-path";

export async function transformAll(): Promise<Awaited<unknown>[]> {
    const distDir = resolvePath(".");
    console.log("transforming all in " + distDir)
    const promises = []
    for (const path of walkDirectory(distDir, ".html")) {
        const p = transform(path, distDir).then(console.log, console.error);
        promises.push(p);
    }
    return await Promise.all(promises);
}

// noinspection JSUnusedGlobalSymbols
export default {
    transform,
    transformAll
}
