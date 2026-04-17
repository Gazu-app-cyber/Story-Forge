import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "app.storyforge.writer",
  appName: "StoryForge",
  webDir: "dist",
  bundledWebRuntime: false,
  server: {
    androidScheme: "https"
  },
  android: {
    allowMixedContent: false,
    captureInput: true
  }
};

export default config;
