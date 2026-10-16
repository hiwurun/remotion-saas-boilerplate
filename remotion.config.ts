import path from "path";
import { Config } from "@remotion/cli/config";
import { enableTailwind } from "@remotion/tailwind-v4";

Config.setVideoImageFormat("jpeg");
Config.setOverwriteOutput(true);
// WebGL in headless Chrome: "angle" has no GPU on this Linux box; SwiftShader-ANGLE ("swangle") works (see README).
Config.setChromiumOpenGlRenderer("swangle");
Config.overrideWebpackConfig((current) => {
  const withTw = enableTailwind(current);
  return {
    ...withTw,
    resolve: {
      ...withTw.resolve,
      alias: { ...(withTw.resolve?.alias ?? {}), "@": path.join(process.cwd(), "src") },
    },
  };
});
