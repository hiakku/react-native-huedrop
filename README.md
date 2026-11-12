# Huedrop · 1.0.2 test-ad preview

A standalone React Native / Expo water-sort game. Separate from Cue Teleprompter and Kira Avatar.

100 deterministic, verified puzzles; animated pours; undo/restart; stars and personal bests; colour-letter labels; reduced-motion support; local progress and hint credits. The first 18 boards are unchanged, so existing saves remain valid.

## Play and hints

Tap a filled bottle, then an empty bottle or one with the same top colour. Each pour transfers the largest matching top run that fits. Finish with every bottle empty or full of a single colour.

Start with three hint credits. A successful solver hint spends one credit; repeating an already-visible hint does not spend another. Failed or bounded searches do not spend credits. Credits survive restarts, level changes and reloads. Undo and restart are always free.

Android: complete an optional Google test rewarded ad to add one hint. Closing early adds nothing. When no ad is available, playing continues. Browser/Expo Go: native ads are unavailable; the clearly labelled free preview hint does not simulate an ad or add credits.

Test interstitials are attempted only on Next after every fifth newly completed puzzle, with a three-minute spacing limit and no break within 90 seconds of a rewarded presentation. No ads open at app launch, on taps, or in the middle of a puzzle. Missing inventory skips the break immediately. Replaying completed puzzles does not trigger another milestone.

## Run

Use Node 22.13+ (22 LTS), 24.3+ or 26+.

```sh
npm ci
npm run web -- --port 8083
npm run check
npx expo-doctor
npm run build:preview
```

AdMob requires the custom Android APK. It is not available in Expo Go or this web preview. `src/ads/useAds.native.ts` imports the SDK only on a supported native environment; web uses a separate implementation. Only Android ad support is enabled in this preview.

Router screen: `src/app/index.tsx`. Rules/solver: `src/engine.ts`. Campaign: `src/levels.json`. Hint balances: `src/session.ts`. Ad lifecycle and frequency policy: `src/ads/controller.ts`.

`node --experimental-strip-types scripts/generate-levels.mjs` regenerates the extended campaign from the immutable original fixture. Commit the resulting JSON; it is shipped with the app and works offline. Future level changes must preserve existing level indices and boards.

## Android build

Cloud project: https://expo.dev/accounts/chit20/projects/hue-drop

1.0.2 test-ad build: https://expo.dev/accounts/chit20/projects/hue-drop/builds/b4cba870-7f0d-4a7b-9dd7-b3de15fd5ca3

The earlier 1.0.0 and 1.0.1 builds were canceled when superseded. The 1.0.2 build finished successfully. Its downloaded archive passes CRC checks and includes the native ad module; actual ad serving still needs the phone test. Android app ID remains `com.chit20.huedrop`; native version code is 3. JavaScript/Hermes export verification is separate from a signed APK build and device testing.

## Data and release

Progress, scores, preferences and hint credits are stored on-device with AsyncStorage. Clearing data/uninstalling removes them. Corrupt/unsupported progress is preserved and blocked rather than silently overwritten. The Android ad SDK contacts Google for test advertisements; the browser does not load it. There is no account, backend, analytics pipeline or purchase integration.

All IDs are Google's demonstration IDs, including in the release-mode preview APK. Test ads earn no revenue. `app.config.ts` deliberately blocks the production build profile until the demo-only integration is replaced with the publisher's real configuration and consent handling. See MONETIZATION.md for the handoff. No store publication has happened.

## Website deployment

Public website: https://hiakku-huedrop.pages.dev/

Build with Node 22.13+ and deploy the compiled website to Cloudflare Pages:

```sh
npm run build:web
npx wrangler@4.160.1 pages deploy dist --project-name hiakku-huedrop --branch main
```

The post-export script moves Expo dependency assets out of `assets/node_modules/` because Cloudflare excludes directories with that name. Only compiled website assets are uploaded. This is a direct upload deployment; GitHub pushes do not automatically redeploy it.
