# Prototype validation

- ESLint, TypeScript and all six engine test groups pass.
- All 18 shipped boards have valid colour counts and replayable solutions.
- Tests exercise immutable pours, invalid moves, off-path solver recovery, search limits, unsolvable positions and incomplete uniform bottles.
- Expo Doctor: 20/20 checks pass.
- Android JavaScript/Hermes export succeeds. No signed native APK/device test yet.
- Browser smoke test: animated pour; illegal full-bottle pour leaves move count unchanged; undo restores board/count; live hint selects correct source/target; a four-move first-level win awards three stars; next puzzle unlocks; board/progress/preferences survive reload; restart resets the current board; locked puzzles remain unavailable.
- Phone viewport 390×844 checked; bottles and controls fit, with secondary progress content below. Default browser width also checked. Browser console recorded no warnings/errors at final inspection.
- Prototype left at puzzle 1 with animations enabled and colour letters disabled. The browser retains a test completion for puzzle 1; new installations start with no completions.

## Huedrop redesign · 1.0.1

- ESLint, TypeScript, all six engine test groups and Android Hermes export pass after theme and animation changes.
- Phone layout rechecked at 390×844, controls visible. Default-width layout checked. Browser console has no warnings/errors.
- Animation code cleans up loops, listens to reduced-motion preferences and pauses ambient movement when inactive. Native rendering still needs the APK phone test.
- Previous build canceled; replacement preview build 8502c2d6-81c0-465c-8946-6a505beb8e13 submitted. Build status is separate from export verification.

## Test-ad integration · 1.0.2

- All 15 tests pass: campaign conservation/solutions, original 18-board compatibility, off-path hints, hint migration/persistence, reward idempotency, early close, show rejection, no inventory, cooldowns, repeated wins, stale inventory, retries, cleanup and Strict Mode lifecycle.
- ESLint and TypeScript pass. Expo Doctor: 20/20 checks. Android/Hermes export succeeds with the AdMob module included.
- Expo introspection confirms Google's sample Android application ID and delayed-measurement metadata; no native directories were generated or edited.
- Isolated browser smoke test on 127.0.0.1: three hints spend 3→2→1→0; the fourth offer explains the Android-only SDK; free preview hints do not add ad credits; the puzzle completes; Next opens puzzle 2; reload preserves the board, completion count and zero balance. User progress at localhost was not used for this test.
- Browser logged a development warning about `.value` in an inline style. The app uses ordinary palette values, not Reanimated shared values, at that style. No runtime errors occurred in this test. Native SDK behavior still requires the APK/device test.
- 1.0.2 preview build b4cba870-7f0d-4a7b-9dd7-b3de15fd5ca3 submitted. Record its final status separately; do not infer a native build pass from the successful JS export.

- Final EAS result: FINISHED. Signed preview APK downloaded; ZIP CRCs pass; Android manifest, Hermes bundle, ARM64 libraries and native Google Mobile Ads module are present. Physical device/ad-serving tests remain pending. See BUILD-1.0.2.json for the artifact hash and build record.
- Production-profile guard was exercised and correctly rejects demonstration ad configuration.
