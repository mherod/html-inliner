import { transformFile, transformHtml } from "./transform";
import { walkDirectory } from "./util/files/walk-directory";
import { resolvePath } from "./util/files/resolve-path";
import { PathLike } from "fs";

export async function transformAll(dir: string): Promise<number> {
    console.log("transforming all in " + dir)
    const promises = []
    for (const path of walkDirectory(dir, ".html")) {
        const p = transformFile(dir, path).catch(console.error)
        promises.push(p);
    }
    return (await Promise.all(promises)).length;
}

// noinspection JSUnusedGlobalSymbols
export default {
    transformFile,
    transformHtml,
    transformAll
}
