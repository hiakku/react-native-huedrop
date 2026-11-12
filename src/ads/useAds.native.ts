import { useEffect, useState, useSyncExternalStore } from "react";
import { Platform } from "react-native";
import Constants from "expo-constants";
import { AdController, AdDriver, AdSignal } from "./controller";
// This build is deliberately TEST-ONLY. No publisher IDs or live ad units are used.
// A release with live ads must add UMP consent BEFORE initialize() and replace this driver.
function testDriver(): AdDriver {
  let sdk: typeof import("react-native-google-mobile-ads");
  return {
    async initialize() {
      sdk = await import("react-native-google-mobile-ads");
      await sdk
        .default()
        .setRequestConfiguration({
          testDeviceIdentifiers: ["EMULATOR"],
          maxAdContentRating: sdk.MaxAdContentRating.G,
        });
      await sdk.default().initialize();
    },
    create(kind) {
      const ad =
        kind === "rewarded"
          ? sdk.RewardedAd.createForAdRequest(sdk.TestIds.REWARDED, {
              requestNonPersonalizedAdsOnly: true,
            })
          : sdk.InterstitialAd.createForAdRequest(sdk.TestIds.INTERSTITIAL, {
              requestNonPersonalizedAdsOnly: true,
            });
      const signals = {
        loaded:
          kind === "rewarded"
            ? sdk.RewardedAdEventType.LOADED
            : sdk.AdEventType.LOADED,
        earned: sdk.RewardedAdEventType.EARNED_REWARD,
        closed: sdk.AdEventType.CLOSED,
        error: sdk.AdEventType.ERROR,
      };
      return {
        on(signal: AdSignal, callback: () => void) {
          if (signal === "earned" && kind !== "rewarded") return () => {};
          if (ad instanceof sdk.RewardedAd) return ad.addAdEventListener(signals[signal], callback);
          return ad.addAdEventListener(signals[signal] as import("react-native-google-mobile-ads").AdEventType, callback);
        },
        load: () => ad.load(),
        show: () => ad.show(),
        destroy: () => ad.destroy(),
      };
    },
  };
}
export function useAds() {
  const [controller] = useState(
    () =>
      new AdController(
        Platform.OS === "android" &&
          Constants.executionEnvironment !== "storeClient"
          ? testDriver()
          : null,
      ),
  );
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  useEffect(() => controller.mount(), [controller]);
  return { controller, ...state };
}
