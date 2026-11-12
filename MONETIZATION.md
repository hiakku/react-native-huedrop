# Moving from test ads to earnings

## Implemented

- `react-native-google-mobile-ads` 17.4.0 with its Expo config plugin.
- Google sample app IDs and `TestIds.REWARDED` / `TestIds.INTERSTITIAL` only. Test mode is not controlled by `__DEV__`, so a signed preview cannot accidentally request live ads.
- Non-personalized test requests, content rating G, delayed app measurement until SDK initialization.
- Ad preloading, one load per slot, one presentation at a time, inventory expiry checks, manual retry, listener cleanup and fail-open puzzle navigation.
- Reward grants only on EARNED_REWARD, once per presentation. Neither show() resolution, a close event, nor browser fallback awards ad credits.
- Three persistent starter hints. Optional rewarded ads grant one credit. Interstitial policy: only after 5 new completions at a Next transition; 180-second spacing; avoid 90 seconds after rewarded ads. Unavailable/failed ads never force a wait for inventory.

## Needed for live ads

The app currently earns nothing. Before replacing the test-only driver:

1. Create/use the owner's AdMob account. Register Huedrop as an Android app and provide its AdMob app ID, rewarded unit ID and interstitial unit ID. No credentials need to be committed to this repository.
2. Configure AdMob Privacy & messaging. Implement `AdsConsent.gatherConsent()` and a `canRequestAds` gate before SDK initialization/requests; add the required privacy-options entry and handle consent changes without leaving preloaded inventory active. Non-personalized requests are not a replacement for consent handling.
3. Prepare a hosted privacy policy and accurate store data-safety/contains-ads/target-audience declarations using the final SDK behavior. A G ad-content cap does not make the app a child-directed product or settle target-audience obligations.
4. Link the app to a supported store and complete AdMob app readiness review. Check app-ads.txt requirements in the owner's AdMob setup. Name/package availability and store acceptance are not guaranteed.
5. Keep sample units for QA, or register QA devices as test devices. Verify live-mode configuration without clicking live ads. Confirm rewards, early closes, no-fill/offline cases, lifecycle/background behavior and the interstitial cadence on physical devices.
6. Replace the production guard only after that live configuration and consent path are reviewed and tested; build the store AAB separately from the preview APK.

A local hint wallet uses client-side reward events. If credits become valuable, transferable or purchasable later, add a server ledger and verified server-side rewards. No purchases or cash-equivalent rewards exist now.

Official references:
- https://docs.page/invertase/react-native-google-mobile-ads/ad-formats/rewarded
- https://docs.page/invertase/react-native-google-mobile-ads/ad-formats/interstitial
- https://docs.page/invertase/react-native-google-mobile-ads/consent-basics
- https://docs.page/invertase/react-native-google-mobile-ads/european-user-consent
- https://support.google.com/admob/answer/10564477
