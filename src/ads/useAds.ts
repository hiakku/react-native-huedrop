import { useState, useSyncExternalStore } from "react";
import { AdController } from "./controller";
// Web does not import native AdMob modules and never simulates an ad reward.
export function useAds() {
  const [controller] = useState(() => new AdController(null));
  const state = useSyncExternalStore(
    controller.subscribe,
    controller.getSnapshot,
    controller.getSnapshot,
  );
  return { controller, ...state };
}
