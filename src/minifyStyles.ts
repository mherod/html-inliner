import postcss from "postcss";
import cssnano from "cssnano";

export async function minifyStyles(input: string): Promise<string> {
  const postcss1 = postcss([cssnano]);
  const processedCss = await postcss1.process(input, { from: undefined });
  return processedCss.css;
}
