import type { ConfigContext, ExpoConfig } from "expo/config";
export default ({ config }: ConfigContext): ExpoConfig => {
  if (process.env.EAS_BUILD_PROFILE === "production") {
    throw new Error(
      "This build uses Google demonstration ad IDs. Configure your AdMob app, live units, UMP consent and privacy disclosures before creating a store release.",
    );
  }
  return config as ExpoConfig;
};
