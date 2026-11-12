import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  Platform,
  Pressable,
  ScrollView,
  Switch,
  Text,
  View,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Svg, { Path } from "react-native-svg";
import { isComplete, isSolved, legalMove, Move, pour, solve } from "../engine";
import { fresh, levels, parseSession, Session, stars } from "../session";
import { useAds } from "../ads/useAds";
import { breakMilestone } from "../ads/controller";
import { Bottle, COLORS } from "../Bottle";
import {
  Atmosphere,
  BoardArt,
  BottleMotion,
  Celebration,
  Entrance,
  useMotionAllowed,
} from "../Motion";
import { Brand, Button, C, Dialog, Icon, IconButton, s } from "../ui";
const KEY = "hue-drop.progress.v1";
const names = [
  "The first pour",
  "Find your rhythm",
  "A softer shade",
  "Little by little",
  "Colour harmony",
  "A moment of clarity",
  "A new perspective",
  "Follow the colour",
  "Room to breathe",
  "Make a little space",
  "A gentle twist",
  "One step ahead",
  "A brighter challenge",
  "Patience pays",
  "Almost in balance",
  "Think it through",
  "A beautiful tangle",
  "Perfectly in tune",
];
export default function Game() {
  const ads = useAds();
  const [hintOffer, setHintOffer] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const adTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const breakDue = useRef(false);
  const [game, setGame] = useState<Session>(() => fresh());
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  const [selected, setSelected] = useState<number | null>(null);
  const [hint, setHint] = useState<Move | null>(null);
  const [message, setMessage] = useState(
    "Tap a bottle, then tap another to pour.",
  );
  const [searching, setSearching] = useState(false);
  const [pouring, setPouring] = useState<Move | null>(null);
  const busy = useRef(false);
  const [anim] = useState(() => new Animated.Value(0));
  const mounted = useRef(true);
  const hintTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [levelPicker, setLevelPicker] = useState(false);
  const [settings, setSettings] = useState(false);
  const [help, setHelp] = useState(false);
  const [win, setWin] = useState(false);
  const [restart, setRestart] = useState(false);
  const [grid, setGrid] = useState({ width: 380, height: 400 });
  const [cellPositions, setCellPositions] = useState<
    Record<number, { x: number; y: number; width: number }>
  >({});
  const queue = useRef(Promise.resolve());
  const { width } = useWindowDimensions();
  const wide = width >= 1080;
  const split = width >= 820;
  const phone = width < 480;
  const current = levels[game.level];
  const solved = isSolved(game.board);
  const completed = Object.keys(game.best).length;
  const maxUnlocked = Math.min(
    levels.length - 1,
    Math.max(0, ...Object.keys(game.best).map((k) => Number(k) + 1)),
  );
  const columns = game.board.length >= 7 ? 4 : 3;
  const bottleWidth = Math.max(
    40,
    Math.min(phone ? 56 : 75, (grid.width - (columns - 1) * 18) / columns - 8),
  );
  const motion = useMotionAllowed(game.motion);
  const disabled =
    !ready || !!pouring || searching || transitioning || ads.showing;
  useEffect(() => {
    mounted.current = true;
    let alive = true;
    AsyncStorage.getItem(KEY)
      .then((raw) => {
        if (alive) {
          const restored = raw ? parseSession(raw) : fresh();
          setGame(restored);
          setWin(isSolved(restored.board));
          setReady(true);
        }
      })
      .catch(() => {
        if (alive)
          setError(
            "Your progress could not be loaded. Reopen the game to try again. Existing progress has not been replaced.",
          );
      });
    return () => {
      alive = false;
      mounted.current = false;
      anim.stopAnimation();
      if (hintTimer.current) clearTimeout(hintTimer.current);
      if (adTimer.current) clearTimeout(adTimer.current);
    };
  }, [anim]);
  useEffect(() => {
    if (!ready) return;
    const value = JSON.stringify({ version: 1, game });
    queue.current = queue.current
      .then(() => AsyncStorage.setItem(KEY, value))
      .then(() => {
        if (mounted.current) setError("");
      })
      .catch(() => {
        if (mounted.current)
          setError(
            "Your progress could not be saved. Keep the game open and tap Retry.",
          );
      });
  }, [game, ready, retry]);
  function chooseLevel(index: number) {
    if (disabled || index > maxUnlocked) return;
    setGame((g) => fresh(index, g.best, g.labels, g.motion, g.hintCredits));
    setSelected(null);
    setHint(null);
    setWin(false);
    setLevelPicker(false);
    setMessage("Tap a bottle, then tap another to pour.");
  }
  function commitMove(move: Move) {
    const next = pour(game.board, move.from, move.to);
    if (!next) return;
    setGame((g) => ({
      ...g,
      board: next,
      history: [...g.history, g.board].slice(-200),
      moves: g.moves + 1,
      best: isSolved(next)
        ? {
            ...g.best,
            [g.level]: Math.min(g.best[g.level] ?? Infinity, g.moves + 1),
          }
        : g.best,
    }));
    if (isSolved(next)) {
      breakDue.current = breakMilestone(game.best, game.level);
      setWin(true);
    }
    setSelected(null);
    setHint(null);
    setPouring(null);
    busy.current = false;
    setMessage(
      isSolved(next)
        ? "Every colour has found its home."
        : "Nice pour. Find your next move.",
    );
  }
  function tapBottle(index: number) {
    if (disabled || busy.current || solved) return;
    if (selected === index) {
      setSelected(null);
      setHint(null);
      setMessage("Tap a bottle, then tap another to pour.");
      return;
    }
    if (selected === null) {
      if (!game.board[index].length) {
        setMessage("Pick a bottle with colour in it first.");
        return;
      }
      setSelected(index);
      setHint(null);
      setMessage(`Bottle ${index + 1} selected. Choose where to pour.`);
      return;
    }
    const move = legalMove(game.board, selected, index);
    if (!move) {
      if (!game.board[index].length)
        setMessage("There isn’t room in that bottle.");
      else if (game.board[index].length === 4)
        setMessage("That bottle is full. Try another one.");
      else setMessage("Pour onto the same colour, or into an empty bottle.");
      return;
    }
    busy.current = true;
    if (!motion) {
      commitMove(move);
      return;
    }
    setPouring(move);
    anim.setValue(0);
    Animated.timing(anim, {
      toValue: 1,
      duration: 540,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: Platform.OS !== "web",
    }).start(({ finished }) => {
      if (!mounted.current) return;
      if (finished) commitMove(move);
      else {
        setPouring(null);
        busy.current = false;
      }
    });
  }
  function undo() {
    if (disabled || !game.history.length) return;
    setGame((g) => ({
      ...g,
      board: g.history[g.history.length - 1],
      history: g.history.slice(0, -1),
      moves: Math.max(0, g.moves - 1),
    }));
    setSelected(null);
    setHint(null);
    setMessage("One step back. A fresh perspective.");
  }
  function requestHint() {
    if (disabled || solved) return;
    if (hint) {
      setMessage(
        `Hint: pour bottle ${hint.from + 1} into bottle ${hint.to + 1}.`,
      );
      return;
    }
    if (game.hintCredits <= 0) {
      setHintOffer(true);
      void ads.controller.start();
      return;
    }
    findHint();
  }
  function findHint(preview = false) {
    if (disabled || solved) return;
    setSearching(true);
    setHint(null);
    setMessage("Looking for a route to the finish…");
    hintTimer.current = setTimeout(() => {
      const result = solve(game.board, 80000);
      if (!mounted.current) return;
      setSearching(false);
      if (result.status === "solved" && result.moves.length) {
        const next = result.moves[0];
        if (!preview)
          setGame((g) => ({
            ...g,
            hintCredits: Math.max(0, g.hintCredits - 1),
          }));
        setSelected(next.from);
        setHint(next);
        setMessage(
          `Hint: pour bottle ${next.from + 1} into bottle ${next.to + 1}.`,
        );
      } else if (result.status === "unsolvable") {
        setMessage("This position has no solution. Undo a move or restart.");
        setSelected(null);
      } else
        setMessage("That position needs a longer search. Try undoing a move.");
    }, 40);
  }
  function watchHintAd() {
    if (!ads.rewardedReady || disabled) return;
    setHintOffer(false);
    setTransitioning(true);
    // Dismiss our Modal before asking the SDK to present its own Activity.
    adTimer.current = setTimeout(() => {
      const shown = ads.controller.watchReward(
        () => {
          if (mounted.current)
            setGame((g) => ({
              ...g,
              hintCredits: Math.min(10000, g.hintCredits + 1),
            }));
        },
        (earned) => {
          if (mounted.current) {
            setTransitioning(false);
            setMessage(
              earned
                ? "One hint added. Tap Hint when you need it."
                : "Ad closed. No hint was used or added.",
            );
          }
        },
      );
      if (!shown && mounted.current) {
        setTransitioning(false);
        setMessage("No test ad is ready. You can keep playing and try again.");
      }
    }, 350);
  }
  function nextPuzzle() {
    if (transitioning || ads.showing) return;
    setWin(false);
    setTransitioning(true);
    const eligible = breakDue.current;
    breakDue.current = false;
    adTimer.current = setTimeout(
      () =>
        ads.controller.showBreak(eligible, () => {
          if (!mounted.current) return;
          if (game.level < levels.length - 1) {
            const next = game.level + 1;
            setGame((g) =>
              fresh(next, g.best, g.labels, g.motion, g.hintCredits),
            );
            setSelected(null);
            setHint(null);
            setMessage("Tap a bottle, then tap another to pour.");
          } else setLevelPicker(true);
          setTransitioning(false);
        }),
      350,
    );
  }
  const stream =
    pouring && cellPositions[pouring.from] && cellPositions[pouring.to]
      ? (() => {
          const from = cellPositions[pouring.from],
            to = cellPositions[pouring.to];
          const x1 = from.x + from.width / 2,
            y1 = from.y + 18,
            x2 = to.x + to.width / 2,
            y2 = to.y + 18;
          return (
            <Animated.View
              pointerEvents="none"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: grid.width,
                height: grid.height,
                opacity: anim.interpolate({
                  inputRange: [0, 0.18, 0.8, 1],
                  outputRange: [0, 0.9, 0.9, 0],
                }),
              }}
            >
              <Svg width={grid.width} height={grid.height}>
                <Path
                  d={`M${x1} ${y1} Q${(x1 + x2) / 2} ${Math.min(y1, y2) - 40} ${x2} ${y2}`}
                  stroke={COLORS[pouring.color].value}
                  strokeWidth={4}
                  fill="none"
                  strokeLinecap="round"
                />
              </Svg>
            </Animated.View>
          );
        })()
      : null;
  const stepList = (
    <>
      {[
        "Tap a bottle to pick it up.",
        "Pour onto the same colour or into an empty bottle.",
        "Fill each bottle with just one colour.",
      ].map((text, i) => (
        <View key={text} style={s.guideStep}>
          <View style={s.stepNumber}>
            <Text style={s.stepText}>{i + 1}</Text>
          </View>
          <Text style={s.guideBody}>{text}</Text>
        </View>
      ))}
    </>
  );
  return (
    <SafeAreaView style={s.safe}>
      <View style={s.root}>
        <Atmosphere motion={motion} />
        {wide && (
          <View style={s.sidebar}>
            <Brand />
            <Text style={s.sidebarLabel}>A LITTLE TIME FOR YOUR MIND</Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Choose a puzzle"
              style={[s.nav, { backgroundColor: "#302D47" }]}
              disabled={disabled}
              onPress={() => setLevelPicker(true)}
            >
              <Icon name="grid" size={17} />
              <Text style={s.navText}>The puzzle room</Text>
              <Text style={s.small}>
                {completed}/{levels.length}
              </Text>
            </Pressable>
            <Pressable
              accessibilityRole="button"
              style={s.nav}
              onPress={() => setHelp(true)}
            >
              <Icon name="help-circle" size={17} />
              <Text style={s.navText}>How to play</Text>
            </Pressable>
            <View style={{ flex: 1 }} />
            <View style={s.sideNote}>
              <Icon name="coffee" color="#819375" />
              <Text style={s.sideTitle}>A slower kind of challenge.</Text>
              <Text style={s.small}>
                No clock to beat. No lives to lose. Just one satisfying pour at
                a time.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              style={s.nav}
              onPress={() => setSettings(true)}
            >
              <Icon name="sliders" size={17} />
              <Text style={s.navText}>Preferences</Text>
            </Pressable>
            <Text style={s.version}>HUEDROP · COLOUR SORT</Text>
          </View>
        )}
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={[s.content, !wide && { padding: 22 }]}
        >
          {!wide && (
            <View style={[s.between, { marginBottom: phone ? 12 : 28 }]}>
              <Brand />
              <View style={s.row}>
                <IconButton
                  name="grid"
                  label="Choose a puzzle"
                  disabled={disabled}
                  onPress={() => setLevelPicker(true)}
                />
                <IconButton
                  name="sliders"
                  label="Preferences"
                  onPress={() => setSettings(true)}
                />
              </View>
            </View>
          )}
          <View style={[s.between, { flexWrap: "wrap", gap: 16 }]}>
            <View>
              <Text style={s.eyebrow}>FIND YOUR FLOW</Text>
              <Text
                style={[
                  s.title,
                  !wide && {
                    fontSize: phone ? 25 : 31,
                    lineHeight: phone ? 31 : 39,
                  },
                ]}
              >
                A little colour.
                <Text style={{ color: "#B7A5F5" }}> A little calm.</Text>
              </Text>
              <Text style={[s.subtitle, phone && { display: "none" }]}>
                Unwind your mind, one satisfying pour at a time.
              </Text>
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="How to play"
              style={s.row}
              onPress={() => setHelp(true)}
            >
              <Icon name="help-circle" size={15} color={C.muted} />
              <Text style={s.small}>How to play</Text>
            </Pressable>
          </View>
          {!!error && (
            <View style={s.notice}>
              <Icon name="alert-circle" color={C.accent} />
              <Text style={s.noticeText}>{error}</Text>
              {ready && (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => setRetry((x) => x + 1)}
                >
                  <Text style={{ color: C.accent, fontWeight: "600" }}>
                    Retry
                  </Text>
                </Pressable>
              )}
            </View>
          )}
          <View
            style={[
              s.layout,
              !split && { flexDirection: "column", marginTop: phone ? 16 : 28 },
            ]}
          >
            <View
              style={[
                s.boardWrap,
                !split && { width: "100%", flex: undefined },
              ]}
            >
              <Entrance key={game.level} motion={motion}>
                <View style={[s.board, !wide && { padding: 18 }]}>
                  <BoardArt />
                  <View style={s.boardTop}>
                    <View>
                      <Text style={s.boardEyebrow}>
                        PUZZLE {String(game.level + 1).padStart(2, "0")} /{" "}
                        {levels.length}
                      </Text>
                      <Text style={s.levelTitle}>
                        {names[game.level] ?? `Colour study ${game.level + 1}`}
                      </Text>
                    </View>
                    <View style={s.difficulty}>
                      {Array.from({ length: 3 }, (_, i) => (
                        <View
                          key={i}
                          style={[
                            s.difficultyDot,
                            { opacity: i < current.colors - 2 ? 1 : 0.2 },
                          ]}
                        />
                      ))}
                    </View>
                  </View>
                  <View
                    style={[
                      s.statRow,
                      phone && { marginTop: 14, paddingBottom: 12 },
                    ]}
                  >
                    <View style={s.stat}>
                      <Text style={s.statLabel}>YOUR MOVES</Text>
                      <Text style={s.statValue}>
                        {String(game.moves).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>PERFECT IN</Text>
                      <Text style={s.statValue}>
                        {String(current.minMoves).padStart(2, "0")}
                      </Text>
                    </View>
                    <View style={s.stat}>
                      <Text style={s.statLabel}>SORTED</Text>
                      <Text style={s.statValue}>
                        {game.board.filter(isComplete).length}
                        <Text style={{ fontSize: 13, color: "#A9AFCA" }}>
                          {" "}
                          / {current.colors}
                        </Text>
                      </Text>
                    </View>
                  </View>
                  <View
                    style={[
                      s.grid,
                      phone && { paddingTop: 16, rowGap: 8, paddingBottom: 6 },
                    ]}
                    onLayout={(e) => {
                      const { width, height } = e.nativeEvent.layout;
                      setGrid((old) =>
                        old.width === width && old.height === height
                          ? old
                          : { width, height },
                      );
                    }}
                  >
                    {game.board.map((tube, index) => {
                      const moving = pouring?.from === index;
                      const receiving = pouring?.to === index;
                      return (
                        <Pressable
                          key={index}
                          accessibilityRole="button"
                          accessibilityLabel={`Bottle ${index + 1}, ${tube.length ? `bottom to top: ${tube.map((c) => COLORS[c].name).join(", ")}` : "empty"}`}
                          accessibilityState={{
                            selected: selected === index,
                            disabled: disabled || solved,
                          }}
                          disabled={disabled || solved}
                          onPress={() => tapBottle(index)}
                          style={[s.tubeCell, { width: bottleWidth + 8 }]}
                          onLayout={(e) => {
                            const { x, y, width } = e.nativeEvent.layout;
                            setCellPositions((previous) => {
                              const old = previous[index];
                              return old?.x === x &&
                                old?.y === y &&
                                old?.width === width
                                ? previous
                                : { ...previous, [index]: { x, y, width } };
                            });
                          }}
                        >
                          <Animated.View
                            style={{
                              transform: [
                                {
                                  translateY: moving
                                    ? anim.interpolate({
                                        inputRange: [0, 0.2, 0.8, 1],
                                        outputRange: [-10, -25, -25, 0],
                                      })
                                    : selected === index
                                      ? -10
                                      : 0,
                                },
                                {
                                  rotate: moving
                                    ? anim.interpolate({
                                        inputRange: [0, 0.2, 0.8, 1],
                                        outputRange: [
                                          "0deg",
                                          pouring!.to > index
                                            ? "16deg"
                                            : "-16deg",
                                          pouring!.to > index
                                            ? "16deg"
                                            : "-16deg",
                                          "0deg",
                                        ],
                                      })
                                    : "0deg",
                                },
                                {
                                  scale: receiving
                                    ? anim.interpolate({
                                        inputRange: [0, 0.5, 1],
                                        outputRange: [1, 1.05, 1],
                                      })
                                    : 1,
                                },
                              ],
                            }}
                          >
                            <BottleMotion
                              complete={isComplete(tube)}
                              selected={selected === index}
                              motion={motion}
                            >
                              <Bottle
                                tube={tube}
                                width={bottleWidth}
                                selected={selected === index}
                                target={hint?.to === index}
                                labels={game.labels}
                              />
                            </BottleMotion>
                          </Animated.View>
                          <Text
                            style={[
                              s.bottleNumber,
                              hint?.to === index && { color: "#EED7A5" },
                            ]}
                          >
                            {hint?.to === index
                              ? "POUR HERE"
                              : String(index + 1).padStart(2, "0")}
                          </Text>
                        </Pressable>
                      );
                    })}
                    {stream}
                  </View>
                  <Text accessibilityLiveRegion="polite" style={s.boardMessage}>
                    {!ready
                      ? "Opening your puzzle room…"
                      : searching
                        ? "Looking for a route to the finish…"
                        : message}
                  </Text>
                </View>
              </Entrance>
              <View style={s.controls}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Undo move"
                  disabled={disabled || !game.history.length}
                  style={[
                    s.tool,
                    { opacity: disabled || !game.history.length ? 0.4 : 1 },
                  ]}
                  onPress={undo}
                >
                  <Icon name="corner-up-left" size={16} />
                  <Text style={s.toolText}>Undo</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Restart puzzle"
                  disabled={disabled}
                  style={[s.tool, { opacity: disabled ? 0.4 : 1 }]}
                  onPress={() => setRestart(true)}
                >
                  <Icon name="rotate-ccw" size={16} />
                  <Text style={s.toolText}>Restart</Text>
                </Pressable>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Get a hint"
                  disabled={disabled || solved}
                  style={[
                    s.tool,
                    {
                      backgroundColor: "#493D68",
                      opacity: disabled || solved ? 0.4 : 1,
                    },
                  ]}
                  onPress={requestHint}
                >
                  <Icon name="sun" size={16} color="#D1B5FF" />
                  <Text style={s.toolText}>
                    {searching ? "Thinking…" : `Hint · ${game.hintCredits}`}
                  </Text>
                </Pressable>
              </View>
              <View style={s.progressCard}>
                <View style={s.between}>
                  <Text style={s.progressTitle}>Your colour journey</Text>
                  <Text style={s.small}>
                    {completed} of {levels.length} solved
                  </Text>
                </View>
                <View style={s.progressTrack}>
                  <View
                    style={{
                      height: 6,
                      width: `${(completed / levels.length) * 100}%`,
                      backgroundColor: "#B5A0F4",
                    }}
                  />
                </View>
              </View>
            </View>
            {split && (
              <View style={s.guide}>
                <View style={s.between}>
                  <Text style={s.guideTitle}>Simple, by design.</Text>
                  <Icon name="droplet" color="#9BAB8C" size={17} />
                </View>
                {stepList}
                <View style={s.divider} />
                <Text style={[s.small, { marginTop: 20 }]}>
                  TODAY’S PALETTE
                </Text>
                <View style={s.colors}>
                  {COLORS.slice(0, current.colors).map((c) => (
                    <View
                      accessibilityLabel={c.name}
                      key={c.name}
                      style={[s.colorDot, { backgroundColor: c.value }]}
                    />
                  ))}
                </View>
                <View style={s.note}>
                  <Icon name="sun" size={18} color="#B19E6D" />
                  <Text style={s.small}>
                    Stuck for a moment? A hint points to a move on a route to
                    the finish.
                  </Text>
                </View>
                <Text style={[s.small, { marginTop: 20 }]}>
                  Three stars for a perfect solve. Two for up to three extra
                  moves. Every finish is worth celebrating.
                </Text>
              </View>
            )}
          </View>
          <View style={s.footer}>
            <Icon name="feather" size={13} color="#99A38C" />
            <Text style={s.footerText}>
              One colour at a time. One moment for yourself.
            </Text>
          </View>
        </ScrollView>
      </View>
      <Dialog visible={levelPicker} onClose={() => setLevelPicker(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>The puzzle room.</Text>
          <IconButton
            name="x"
            label="Close puzzle selection"
            onPress={() => setLevelPicker(false)}
          />
        </View>
        <Text style={[s.body, { marginTop: 10 }]}>
          A little more colour. A little more challenge. Solve each puzzle to
          open the next.
        </Text>
        <View style={s.levelGrid}>
          {levels.map((level, i) => (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Play puzzle ${i + 1}${i > maxUnlocked ? ", locked" : ""}`}
              disabled={i > maxUnlocked || disabled}
              key={i}
              onPress={() => chooseLevel(i)}
              style={[
                s.levelCell,
                i === game.level && {
                  borderColor: "#B5A0F4",
                  backgroundColor: "#39304F",
                },
                i > maxUnlocked && { opacity: 0.4 },
              ]}
            >
              {i > maxUnlocked ? (
                <Icon name="lock" size={17} color={C.muted} />
              ) : (
                <Text style={s.levelNumber}>
                  {String(i + 1).padStart(2, "0")}
                </Text>
              )}
              <View style={s.miniStars}>
                {Array.from({ length: 3 }, (_, j) => (
                  <Icon
                    key={j}
                    name="star"
                    size={9}
                    color={
                      game.best[i] !== undefined &&
                      j < stars(game.best[i], level.minMoves)
                        ? "#BD985A"
                        : "#56576F"
                    }
                  />
                ))}
              </View>
            </Pressable>
          ))}
        </View>
      </Dialog>
      <Dialog visible={hintOffer} onClose={() => setHintOffer(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>A little nudge?</Text>
          <IconButton
            name="x"
            label="Close hint offer"
            onPress={() => setHintOffer(false)}
          />
        </View>
        <Text style={[s.body, { marginTop: 14, marginBottom: 20 }]}>
          You’ve used your three starter hints. Complete an optional test ad to
          earn one more hint. Playing, undo and restart stay free.
        </Text>
        {ads.supported ? (
          <>
            <Text
              accessibilityLiveRegion="polite"
              style={[s.small, { marginBottom: 16 }]}
            >
              {ads.message}
            </Text>
            <Button
              label="Watch test ad · +1 hint"
              icon="play"
              onPress={watchHintAd}
              disabled={!ads.rewardedReady || disabled}
            />
            {!ads.rewardedReady && (
              <View style={{ marginTop: 10 }}>
                <Button
                  label="Retry loading test ad"
                  secondary
                  onPress={() => {
                    void ads.controller.start();
                  }}
                />
              </View>
            )}
          </>
        ) : (
          <>
            <Text style={[s.small, { marginBottom: 16 }]}>
              AdMob test ads run in the Android APK. This preview does not show
              videos or simulate ad rewards.
            </Text>
            <Button
              label="Use a free preview hint"
              icon="sun"
              onPress={() => {
                setHintOffer(false);
                findHint(true);
              }}
            />
          </>
        )}
        <View style={{ height: 10 }} />
        <Button
          label="Keep playing"
          secondary
          onPress={() => setHintOffer(false)}
        />
      </Dialog>
      <Dialog visible={settings} onClose={() => setSettings(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>Make yourself comfortable.</Text>
          <IconButton
            name="x"
            label="Close preferences"
            onPress={() => setSettings(false)}
          />
        </View>
        <View style={s.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingText}>Colour labels</Text>
            <Text style={s.small}>
              Show letters so colour isn’t the only clue.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Colour labels"
            disabled={!ready}
            value={game.labels}
            onValueChange={(labels) => setGame((g) => ({ ...g, labels }))}
            trackColor={{ true: "#9D86E2" }}
          />
        </View>
        <View style={s.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={s.settingText}>Animations</Text>
            <Text style={s.small}>
              Turn off for a still background and instant moves.
            </Text>
          </View>
          <Switch
            accessibilityLabel="Pouring animations"
            disabled={disabled}
            value={game.motion}
            onValueChange={(motion) => setGame((g) => ({ ...g, motion }))}
            trackColor={{ true: "#9D86E2" }}
          />
        </View>
        <View style={[s.note, { marginBottom: 22 }]}>
          <Icon name="shield" color="#8A9977" />
          <Text style={s.small}>
            Progress and hint credits stay on this device. The Android preview
            uses Google test ads, which earn no money. No purchases or accounts
            are required. Clearing app data removes progress.
          </Text>
        </View>
        <View style={[s.note, { marginBottom: 16 }]}>
          <Text style={s.settingText}>Test ads only · no revenue</Text>
          <Text style={s.small}>{ads.message}</Text>
          {ads.supported && (
            <Button
              label="Retry test ads"
              secondary
              onPress={() => {
                void ads.controller.start();
              }}
              disabled={ads.showing}
            />
          )}
        </View>
        <Button label="Back to my puzzle" onPress={() => setSettings(false)} />
      </Dialog>
      <Dialog visible={help} onClose={() => setHelp(false)}>
        <View style={s.between}>
          <Text style={s.dialogTitle}>A few simple pours.</Text>
          <IconButton
            name="x"
            label="Close how to play"
            onPress={() => setHelp(false)}
          />
        </View>
        {stepList}
        <Text style={[s.body, { marginTop: 24, marginBottom: 22 }]}>
          A pour moves as many matching top layers as will fit. Tap a selected
          bottle again to put it down. Use Undo or Restart whenever you need a
          fresh start.
        </Text>
        <Button label="Let’s play" onPress={() => setHelp(false)} />
      </Dialog>
      <Dialog visible={restart} onClose={() => setRestart(false)}>
        <Text style={s.dialogTitle}>A fresh start?</Text>
        <Text style={[s.body, { marginVertical: 20 }]}>
          This puzzle will return to its starting arrangement. Your completed
          puzzles and best scores stay saved.
        </Text>
        <Button
          label="Restart this puzzle"
          icon="rotate-ccw"
          onPress={() => {
            setGame((g) =>
              fresh(g.level, g.best, g.labels, g.motion, g.hintCredits),
            );
            setSelected(null);
            setHint(null);
            setMessage("A fresh start. You’ve got this.");
            setRestart(false);
          }}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Keep playing"
          secondary
          onPress={() => setRestart(false)}
        />
      </Dialog>
      <Dialog visible={win} onClose={() => setWin(false)}>
        {win && <Celebration motion={motion} />}
        <View style={s.winMark}>
          <Icon name="check" size={36} color="#7E956B" />
        </View>
        <Text style={[s.dialogTitle, { textAlign: "center" }]}>
          Perfectly in place.
        </Text>
        <Text style={[s.body, { textAlign: "center", marginTop: 10 }]}>
          Every colour has found its home. Nice work.
        </Text>
        <View style={s.winStars}>
          {Array.from({ length: 3 }, (_, i) => (
            <Icon
              key={i}
              name="star"
              size={30}
              color={
                i < stars(game.moves, current.minMoves) ? "#C4A064" : "#D8DED0"
              }
            />
          ))}
        </View>
        <View style={s.winStat}>
          <View style={{ alignItems: "center" }}>
            <Text style={s.small}>YOUR MOVES</Text>
            <Text style={[s.levelNumber, { marginTop: 6 }]}>{game.moves}</Text>
          </View>
          <View style={{ alignItems: "center" }}>
            <Text style={s.small}>PERSONAL BEST</Text>
            <Text style={[s.levelNumber, { marginTop: 6 }]}>
              {game.best[game.level] ?? game.moves}
            </Text>
          </View>
        </View>
        <Button
          label={
            game.level < levels.length - 1
              ? "Next puzzle"
              : "Explore your solved puzzles"
          }
          icon="arrow-right"
          onPress={nextPuzzle}
          disabled={transitioning || ads.showing}
        />
        <View style={{ height: 10 }} />
        <Button
          label="Stay a little longer"
          secondary
          onPress={() => setWin(false)}
        />
      </Dialog>
    </SafeAreaView>
  );
}
