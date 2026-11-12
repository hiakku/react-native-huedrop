export type AdKind = "rewarded" | "interstitial";
export type AdSignal = "loaded" | "earned" | "closed" | "error";
export interface AdPort {
  on(event: AdSignal, callback: () => void): () => void;
  load(): void;
  show(): Promise<void>;
  destroy(): void;
}
export interface AdDriver {
  initialize(): Promise<void>;
  create(kind: AdKind): AdPort;
}
export type AdsState = {
  supported: boolean;
  status: "unavailable" | "loading" | "ready" | "error";
  rewardedReady: boolean;
  interstitialReady: boolean;
  showing: boolean;
  message: string;
};
type Slot = {
  ad: AdPort;
  ready: boolean;
  loading: boolean;
  loadedAt: number;
  unsubscribe: (() => void)[];
};
const HOUR = 60 * 60 * 1000;
export function breakMilestone(best: Record<string, number>, level: number) {
  return best[level] === undefined && (Object.keys(best).length + 1) % 5 === 0;
}
// One full-screen presentation at a time, with no delayed surprise ads.
export class AdController {
  private state: AdsState;
  private listeners = new Set<() => void>();
  private slots: Partial<Record<AdKind, Slot>> = {};
  private alive = true;
  private initializing = false;
  private lifecycle = 0;
  private started = false;
  private presentation: {
    kind: AdKind;
    earned: boolean;
    reward?: () => void;
    done: (earned: boolean) => void;
  } | null = null;
  private lastBreak = -Infinity;
  private lastReward = -Infinity;
  constructor(
    private driver: AdDriver | null,
    private now = Date.now,
  ) {
    this.state = {
      supported: !!driver,
      status: driver ? "loading" : "unavailable",
      rewardedReady: false,
      interstitialReady: false,
      showing: false,
      message: driver
        ? "Preparing test ads…"
        : "Test ads are available in the Android APK. Browser hints remain free.",
    };
  }
  mount() {
    const epoch = ++this.lifecycle;
    void this.start();
    return () => {
      queueMicrotask(() => {
        if (this.lifecycle === epoch) this.dispose();
      });
    };
  }
  getSnapshot = () => this.state;
  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  };
  private update(patch: Partial<AdsState>) {
    if (!this.alive) return;
    this.state = { ...this.state, ...patch };
    for (const listener of this.listeners) listener();
  }
  async start() {
    if (!this.driver || this.initializing || !this.alive) return;
    if (this.started) {
      this.load("rewarded");
      this.load("interstitial");
      return;
    }
    this.initializing = true;
    this.update({ status: "loading", message: "Preparing test ads…" });
    try {
      await this.driver.initialize();
      if (!this.alive) return;
      for (const kind of ["rewarded", "interstitial"] as const) {
        const slot: Slot = {
          ad: this.driver.create(kind),
          ready: false,
          loading: false,
          loadedAt: 0,
          unsubscribe: [],
        };
        this.slots[kind] = slot;
        slot.unsubscribe = [
          slot.ad.on("loaded", () => {
            slot.loading = false;
            slot.ready = true;
            slot.loadedAt = this.now();
            this.update({
              [kind === "rewarded" ? "rewardedReady" : "interstitialReady"]:
                true,
              status: "ready",
              message: "Google test ads · no revenue",
            });
          }),
          slot.ad.on("earned", () => {
            const current = this.presentation;
            if (kind !== "rewarded" || current?.kind !== kind || current.earned)
              return;
            current.earned = true;
            current.reward?.();
          }),
          slot.ad.on("closed", () => {
            this.unready(kind);
            this.finish(kind);
            this.load(kind);
          }),
          slot.ad.on("error", () => {
            slot.loading = false;
            this.unready(kind);
            this.update({
              message:
                "A test ad is unavailable. You can keep playing or retry.",
            });
            this.finish(kind);
          }),
        ];
      }
      this.started = true;
      this.load("rewarded");
      this.load("interstitial");
    } catch {
      this.clearSlots();
      this.update({
        status: "error",
        message: "Test ads could not start. Keep playing and retry later.",
      });
    } finally {
      this.initializing = false;
    }
  }
  private unready(kind: AdKind) {
    const slot = this.slots[kind];
    if (slot) slot.ready = false;
    this.update({
      [kind === "rewarded" ? "rewardedReady" : "interstitialReady"]: false,
    });
  }
  private load(kind: AdKind) {
    const slot = this.slots[kind];
    if (!slot || slot.loading || slot.ready || this.presentation || !this.alive)
      return;
    slot.loading = true;
    try {
      slot.ad.load();
    } catch {
      slot.loading = false;
      this.update({
        message: "A test ad could not load. Retry when connected.",
      });
    }
  }
  private fresh(kind: AdKind) {
    const slot = this.slots[kind];
    if (!slot?.ready) return false;
    if (this.now() - slot.loadedAt >= HOUR) {
      this.unready(kind);
      this.load(kind);
      return false;
    }
    return true;
  }
  private finish(kind: AdKind) {
    if (this.presentation?.kind !== kind) return;
    const current = this.presentation;
    this.presentation = null;
    this.update({ showing: false });
    current.done(current.earned);
  }
  private present(
    kind: AdKind,
    reward: (() => void) | undefined,
    done: (earned: boolean) => void,
  ) {
    if (!this.alive || this.presentation || !this.fresh(kind)) return false;
    this.presentation = { kind, earned: false, reward, done };
    this.update({ showing: true });
    this.unready(kind);
    // show() resolving means presentation was accepted, not that it was completed.
    try {
      this.slots[kind]!.ad.show().catch(() => {
        this.finish(kind);
        this.load(kind);
      });
    } catch {
      this.finish(kind);
      this.load(kind);
    }
    return true;
  }
  watchReward(reward: () => void, done: (earned: boolean) => void) {
    const shown = this.present("rewarded", reward, done);
    if (shown) this.lastReward = this.now();
    return shown;
  }
  showBreak(eligible: boolean, done: () => void) {
    if (
      !eligible ||
      this.now() - this.lastBreak < 180000 ||
      this.now() - this.lastReward < 90000
    ) {
      done();
      return false;
    }
    const shown = this.present("interstitial", undefined, done);
    if (shown) this.lastBreak = this.now();
    else done();
    return shown;
  }
  private clearSlots() {
    for (const slot of Object.values(this.slots)) {
      slot.unsubscribe.forEach((off) => off());
      slot.ad.destroy();
    }
    this.slots = {};
  }
  dispose() {
    this.alive = false;
    this.presentation = null;
    this.clearSlots();
    this.listeners.clear();
  }
}
