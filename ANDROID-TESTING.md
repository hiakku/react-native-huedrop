# Huedrop 1.0.2 · Android test-ad preview

Build: https://expo.dev/accounts/chit20/projects/hue-drop/builds/b4cba870-7f0d-4a7b-9dd7-b3de15fd5ca3

When the build is finished, open the link on your Android phone, download/install the APK and run it. It runs without Expo Go or the computer's development server.

1. Play the first puzzle. Use a hint and confirm the balance drops by one. Reopening the same visible hint should not charge again.
2. Use all three starter hints. Open Hint, opt into the test ad and complete it. The ad should be identified as a test ad. Return to the game: exactly one hint should be added.
3. Try another rewarded ad but close it before earning the reward; confirm no credit is added. Returning from an ad should preserve the puzzle and move count.
4. Close/reopen Huedrop. Confirm board, best scores, preferences and credits persist. Restart/Undo should remain free and should not replenish credits.
5. Complete five previously unsolved puzzles and tap Next. A loaded test interstitial may appear between puzzles. It must not appear on individual bottle taps or while pouring. Replaying one solved puzzle must not repeat the milestone. Breaks are skipped if not ready or inside the cooldown.
6. Try airplane mode: normal play, undo, restart and the included campaign should work. Ad failures must not block continuation. Rewarded hints may be unavailable offline.
7. Test returning Home, reopening, rotation lock, small screens, reduced-motion settings and close buttons on your actual device. Record device model/Android version for any issue.

These test ads generate no earnings. No store release has been published. Browser tests and JavaScript export do not prove native SDK/device behavior; the physical-phone checks above remain required.
