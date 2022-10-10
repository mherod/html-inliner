import * as prettier from "prettier";
import { yellow } from "colorette";

export function formatJavascript(s: string): string {
  try {
    return prettier.format(s, { parser: "babel" });
  } catch (error) {
    console.warn(
      yellow("format javascript failed"),
      error
    );
    return s;
  }
}
