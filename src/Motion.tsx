import React, { useEffect, useState } from "react";
import {
  AccessibilityInfo,
  Animated,
  AppState,
  Easing,
  Platform,
  StyleSheet,
  View,
} from "react-native";
import Svg, {
  Defs,
  LinearGradient,
  Stop,
  Rect,
  Circle,
  Path,
} from "react-native-svg";
const native = Platform.OS !== "web";
export function useMotionAllowed(enabled: boolean) {
  const [reduced, setReduced] = useState(true);
  const [active, setActive] = useState(AppState.currentState === "active");
  useEffect(() => {
    let alive = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((v) => {
        if (alive) setReduced(v);
      })
      .catch(() => {});
    const setting = AccessibilityInfo.addEventListener(
      "reduceMotionChanged",
      setReduced,
    );
    const lifecycle = AppState.addEventListener("change", (state) =>
      setActive(state === "active"),
    );
    return () => {
      alive = false;
      setting.remove();
      lifecycle.remove();
    };
  }, []);
  return enabled && !reduced && active;
}
export function Atmosphere({ motion }: { motion: boolean }) {
  const [drift] = useState(() => new Animated.Value(0));
  useEffect(() => {
    if (!motion) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(drift, {
          toValue: 1,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
          isInteraction: false,
        }),
        Animated.timing(drift, {
          toValue: 0,
          duration: 8000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: native,
          isInteraction: false,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [motion, drift]);
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Animated.View
        style={{
          position: "absolute",
          right: -160,
          top: -140,
          width: 620,
          height: 620,
          opacity: 0.65,
          transform: [
            {
              translateY: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 45],
              }),
            },
            {
              translateX: drift.interpolate({
                inputRange: [0, 1],
                outputRange: [0, -25],
              }),
            },
          ],
        }}
      >
        <Svg width="100%" height="100%">
          <Defs>
            <LinearGradient id="aura" x1="0" y1="0" x2="1" y2="1">
              <Stop stopColor="#6C53B9" stopOpacity=".32" />
              <Stop offset="1" stopColor="#131523" stopOpacity="0" />
            </LinearGradient>
          </Defs>
          <Circle cx="310" cy="310" r="310" fill="url(#aura)" />
        </Svg>
      </Animated.View>
    </View>
  );
}
export function BoardArt() {
  return (
    <View
      pointerEvents="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      style={StyleSheet.absoluteFill}
    >
      <Svg
        width="100%"
        height="100%"
        preserveAspectRatio="none"
        viewBox="0 0 600 600"
      >
        <Defs>
          <LinearGradient id="boardGlow" x1="0" y1="0" x2="1" y2="1">
            <Stop stopColor="#30344F" />
            <Stop offset=".5" stopColor="#22283E" />
            <Stop offset="1" stopColor="#192E38" />
          </LinearGradient>
        </Defs>
        <Rect width="600" height="600" fill="url(#boardGlow)" />
        <Circle
          cx="590"
          cy="20"
          r="180"
          fill="none"
          stroke="#B9ACF3"
          strokeOpacity=".07"
        />
        <Circle
          cx="590"
          cy="20"
          r="220"
          fill="none"
          stroke="#B9ACF3"
          strokeOpacity=".04"
        />
        <Path
          d="M0 500 Q250 420 600 570"
          fill="none"
          stroke="#91E2D0"
          strokeOpacity=".04"
        />
      </Svg>
    </View>
  );
}
export function Entrance({
  children,
  motion,
}: {
  children: React.ReactNode;
  motion: boolean;
}) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const entry = Animated.timing(value, {
      toValue: 1,
      duration: motion ? 600 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    entry.start();
    return () => entry.stop();
  }, [value, motion]);
  return (
    <Animated.View
      style={{
        opacity: value,
        transform: [
          {
            translateY: value.interpolate({
              inputRange: [0, 1],
              outputRange: [18, 0],
            }),
          },
        ],
      }}
    >
      {children}
    </Animated.View>
  );
}
export function BottleMotion({
  children,
  complete,
  selected,
  motion,
}: {
  children: React.ReactNode;
  complete: boolean;
  selected: boolean;
  motion: boolean;
}) {
  const [scale] = useState(() => new Animated.Value(1));
  useEffect(() => {
    if (!motion) return;
    const animation = Animated.sequence([
      Animated.timing(scale, {
        toValue: complete ? 1.12 : selected ? 1.045 : 1,
        duration: 160,
        useNativeDriver: native,
      }),
      Animated.spring(scale, {
        toValue: 1,
        friction: 5,
        tension: 110,
        useNativeDriver: native,
      }),
    ]);
    animation.start();
    return () => animation.stop();
  }, [complete, selected, motion, scale]);
  return (
    <Animated.View style={{ transform: [{ scale }] }}>{children}</Animated.View>
  );
}
export function Celebration({ motion }: { motion: boolean }) {
  const [value] = useState(() => new Animated.Value(0));
  useEffect(() => {
    const a = Animated.timing(value, {
      toValue: 1,
      duration: motion ? 1600 : 0,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: native,
    });
    a.start();
    return () => a.stop();
  }, [value, motion]);
  return (
    <View pointerEvents="none" style={{ height: 0, alignItems: "center" }}>
      {Array.from({ length: 12 }, (_, i) => (
        <Animated.View
          key={i}
          style={{
            position: "absolute",
            width: i % 2 ? 5 : 8,
            height: i % 2 ? 12 : 8,
            borderRadius: i % 2 ? 2 : 5,
            backgroundColor: ["#AFA0FF", "#7BE1C5", "#FFB48D"][i % 3],
            opacity: motion
              ? value.interpolate({
                  inputRange: [0, 0.15, 0.8, 1],
                  outputRange: [0, 1, 1, 0],
                })
              : 0,
            transform: [
              {
                translateX: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0, Math.cos((i * Math.PI) / 6) * 135],
                }),
              },
              {
                translateY: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: [30, Math.sin((i * Math.PI) / 6) * 100 + 60],
                }),
              },
              {
                rotate: value.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0deg", `${i * 73}deg`],
                }),
              },
            ],
          }}
        />
      ))}
    </View>
  );
}
