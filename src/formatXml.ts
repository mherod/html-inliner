import * as prettier from "prettier";
import { yellow } from "colorette";

export function formatXml(s: string): string {
  try {
    return prettier.format(s, { parser: "xml" });
  } catch (error) {
    console.warn(
      yellow("format html failed"),
      JSON.stringify(error).substring(0, 100)
    );
    return s;
  }
}
