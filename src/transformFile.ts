import { existsSync, readFileSync, writeFileSync } from "fs";
import mime from "mime-types";
import { green, red, yellow } from "colorette";
import { transformHtml } from "./transformHtml";
import { transformStyles } from "./transformStyles";

export async function transformFile(dir: string, fileName: string) {
  if (!existsSync(fileName)) {
    throw new Error("file does not exist: " + fileName.substring(0, 100));
  }
  const fileNameForPrint = fileName.substring(dir.length).slice(-30);
  // console.log(blue("Transforming"), fileNameForPrint);
  const inputText: string = readFileSync(fileName, "utf8");
  let outputText: string = inputText;
  switch (mime.lookup(fileName)) {
    case "text/html":
      outputText = await transformHtml(inputText, dir);
      break;
    case "text/css":
      outputText = await transformStyles(inputText, dir);
      break;
  }
  if (inputText != outputText) {
    const increase = outputText.length - inputText.length;
    if (increase > 1024 * 1024) {
      console.log(
        fileNameForPrint.padStart(30, " "),
        yellow("Increased by"),
        red((increase / 1024 / 1024).toFixed(1) + "MB")
      );
    } else if (increase > 1024) {
      console.log(
        fileNameForPrint.padStart(30, " "),
        yellow("Increased by"),
        yellow((increase / 1024).toFixed(1) + "KB")
      );
    } else if (increase > 0) {
      console.log(
        fileNameForPrint.padStart(30, " "),
        yellow("Increased by"),
        green(increase.toFixed(1) + "B")
      );
    }
    writeFileSync(fileName, outputText, "utf8");
  }
  return outputText ?? "";
}
