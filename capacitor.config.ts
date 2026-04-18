import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "story.forge",
  appName: "StoryForge",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false,
    captureInput: true,
    webContentsDebuggingEnabled: false
  }
};

export default config;
