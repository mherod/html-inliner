import CleanCSS from "clean-css";
import { minify, Result } from "csso";

export function minifyCss(input: string) {
  const cleanCssOutput: CleanCSS.Output = new CleanCSS({
    inline: ["all"],
    level: 2
  }).minify(input);
  const styles: string = cleanCssOutput.styles;
  const cssoOutput: Result = minify(styles);
  return cssoOutput.css;
}
