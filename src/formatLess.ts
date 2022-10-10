import * as prettier from "prettier";
import { yellow } from "colorette";

export function formatLess(s: string): string {
  try {
    return prettier.format(s, { parser: "less" });
  } catch (error) {
    console.warn(
      yellow("format less failed"),
      error
    );
    return s;
  }
}
