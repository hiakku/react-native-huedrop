import React from "react";
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
export const C = {
  bg: "#131523",
  ink: "#F5F1FF",
  muted: "#A5A9C1",
  line: "#363B53",
  accent: "#FFA789",
  green: "#7967C8",
  board: "#242B40",
  cream: "#E7DCFF",
};
export type IconName = React.ComponentProps<typeof Feather>["name"];
export function Icon({
  name,
  size = 20,
  color = C.ink,
}: {
  name: IconName;
  size?: number;
  color?: string;
}) {
  return <Feather name={name} size={size} color={color} />;
}
export function IconButton({
  name,
  label,
  onPress,
  disabled = false,
}: {
  name: IconName;
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.iconButton,
        { transform: [{ scale: pressed ? 0.92 : 1 }] },
        { opacity: disabled ? 0.3 : pressed ? 0.5 : 1 },
      ]}
    >
      <Icon name={name} />
    </Pressable>
  );
}
export function Button({
  label,
  onPress,
  icon,
  secondary = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  icon?: IconName;
  secondary?: boolean;
  disabled?: boolean;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        s.button,
        { transform: [{ scale: pressed ? 0.97 : 1 }] },
        secondary && s.secondary,
        { opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}
    >
      {icon && (
        <Icon name={icon} size={17} color={secondary ? C.ink : "white"} />
      )}
      <Text style={[s.buttonText, secondary && { color: C.ink }]}>{label}</Text>
    </Pressable>
  );
}
export function Brand() {
  return (
    <View style={s.row}>
      <View style={s.logo}>
        <Icon name="droplet" color="#F2EAFF" size={22} />
      </View>
      <Text style={s.brand}>
        Huedrop<Text style={{ color: C.accent }}>.</Text>
      </Text>
    </View>
  );
}
export function Dialog({
  visible,
  onClose,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={s.overlay}>
        <ScrollView
          style={{ maxWidth: 470, width: "100%", maxHeight: "90%" }}
          contentContainerStyle={s.dialog}
        >
          {children}
        </ScrollView>
      </View>
    </Modal>
  );
}
export const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: C.bg },
  root: { flex: 1, flexDirection: "row" },
  row: { flexDirection: "row", alignItems: "center", gap: 10 },
  between: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  sidebar: {
    width: 225,
    padding: 25,
    borderRightWidth: 1,
    borderRightColor: C.line,
  },
  logo: {
    width: 34,
    height: 37,
    borderRadius: 12,
    backgroundColor: C.green,
    alignItems: "center",
    justifyContent: "center",
  },
  brand: { fontSize: 24, fontWeight: "700", letterSpacing: -1, color: C.ink },
  sidebarLabel: {
    fontSize: 8,
    color: "#9396B4",
    letterSpacing: 1.5,
    marginTop: 53,
    marginBottom: 20,
  },
  nav: {
    padding: 13,
    borderRadius: 9,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 7,
  },
  navText: { fontSize: 12, color: C.ink, fontWeight: "600", flex: 1 },
  sideNote: {
    backgroundColor: "#24283D",
    padding: 16,
    borderRadius: 12,
    gap: 10,
    marginBottom: 18,
  },
  small: { fontSize: 11, color: C.muted, lineHeight: 18 },
  sideTitle: { fontSize: 12, fontWeight: "600", color: C.ink },
  version: {
    fontSize: 7,
    color: "#9396B4",
    letterSpacing: 1.7,
    textAlign: "center",
    marginTop: 24,
  },
  content: {
    padding: 36,
    width: "100%",
    maxWidth: 1200,
    alignSelf: "center",
    paddingBottom: 30,
  },
  eyebrow: {
    fontSize: 9,
    letterSpacing: 1.7,
    fontWeight: "700",
    color: "#B8A4ED",
    marginBottom: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: "700",
    color: C.ink,
    letterSpacing: -1.4,
    lineHeight: 44,
  },
  subtitle: { fontSize: 13, color: C.muted, lineHeight: 22, marginTop: 8 },
  iconButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 16,
    backgroundColor: "#25283B",
    borderWidth: 1,
    borderColor: "#3D4059",
  },
  button: {
    minHeight: 46,
    paddingHorizontal: 19,
    paddingVertical: 12,
    backgroundColor: C.green,
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 9,
  },
  secondary: { backgroundColor: "#323047" },
  buttonText: { fontSize: 12, fontWeight: "600", color: "white" },
  layout: {
    flexDirection: "row",
    gap: 24,
    alignItems: "flex-start",
    marginTop: 28,
  },
  boardWrap: { flex: 1, minWidth: 0 },
  board: {
    borderRadius: 28,
    boxShadow: "0px 18px 50px #07091455",
    backgroundColor: C.board,
    padding: 23,
    borderWidth: 1,
    borderColor: "#4A4C6B",
    overflow: "hidden",
  },
  boardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  boardEyebrow: { fontSize: 8, color: "#BBB9D5", letterSpacing: 1.7 },
  levelTitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#F8F3FF",
    letterSpacing: -0.6,
    marginTop: 7,
  },
  difficulty: { flexDirection: "row", gap: 4, alignItems: "center" },
  difficultyDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#FFBD99",
  },
  statRow: {
    flexDirection: "row",
    gap: 20,
    marginTop: 22,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#20243813",
  },
  stat: { flex: 1 },
  statLabel: { fontSize: 8, letterSpacing: 1.1, color: "#ACB3D2" },
  statValue: {
    fontSize: 21,
    color: "#F4EEFF",
    fontWeight: "500",
    marginTop: 6,
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    alignItems: "flex-start",
    columnGap: 18,
    rowGap: 18,
    paddingTop: 40,
    paddingBottom: 18,
    position: "relative",
  },
  tubeCell: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 14,
    paddingHorizontal: 4,
  },
  bottleNumber: { fontSize: 9, color: "#B0B7D0", marginTop: 4 },
  boardMessage: {
    color: "#C1C8DC",
    textAlign: "center",
    fontSize: 11,
    lineHeight: 19,
    minHeight: 38,
    marginTop: 8,
  },
  controls: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: 9,
    marginTop: 15,
  },
  tool: {
    flex: 1,
    borderWidth: 1,
    borderColor: C.line,
    backgroundColor: "#252A40",
    paddingVertical: 13,
    borderRadius: 15,
    alignItems: "center",
    gap: 7,
    flexDirection: "row",
    justifyContent: "center",
  },
  toolText: { fontSize: 11, fontWeight: "600", color: C.ink },
  guide: {
    width: 252,
    backgroundColor: "#202438",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 17,
    padding: 22,
  },
  guideTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: C.ink,
    letterSpacing: -0.3,
  },
  guideStep: { flexDirection: "row", gap: 11, marginTop: 23 },
  stepNumber: {
    width: 24,
    height: 24,
    borderRadius: 8,
    backgroundColor: "#34344F",
    alignItems: "center",
    justifyContent: "center",
  },
  stepText: { fontSize: 10, color: "#BCB7D4", fontWeight: "600" },
  guideBody: { fontSize: 12, lineHeight: 21, color: C.muted, flex: 1 },
  colors: { flexDirection: "row", gap: 7, marginTop: 20 },
  colorDot: { width: 20, height: 20, borderRadius: 8 },
  divider: { height: 1, backgroundColor: C.line, marginTop: 22 },
  note: {
    marginTop: 23,
    backgroundColor: "#2D2A40",
    padding: 14,
    borderRadius: 10,
    gap: 8,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    alignItems: "center",
    marginTop: 28,
  },
  footerText: { fontSize: 10, color: "#8589A7" },
  progressCard: {
    padding: 17,
    backgroundColor: "#23273B",
    borderRadius: 18,
    marginTop: 22,
  },
  progressTitle: { fontSize: 12, fontWeight: "600", color: C.ink },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "#393D55",
    marginTop: 12,
    overflow: "hidden",
  },
  notice: {
    marginTop: 16,
    padding: 14,
    borderRadius: 10,
    backgroundColor: "#4A3040",
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  noticeText: { fontSize: 12, lineHeight: 20, color: C.ink, flex: 1 },
  overlay: {
    flex: 1,
    backgroundColor: "#090B18DB",
    padding: 22,
    justifyContent: "center",
    alignItems: "center",
  },
  dialog: {
    padding: 26,
    borderRadius: 26,
    backgroundColor: "#202438",
    borderWidth: 1,
    borderColor: C.line,
  },
  dialogTitle: {
    fontSize: 25,
    fontWeight: "600",
    letterSpacing: -0.7,
    color: C.ink,
    flexShrink: 1,
  },
  body: { fontSize: 13, color: C.muted, lineHeight: 22 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 18,
    marginTop: 25,
  },
  settingText: { fontSize: 13, color: C.ink, fontWeight: "500" },
  levelGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10, marginTop: 24 },
  levelCell: {
    width: "22.5%",
    aspectRatio: 1,
    backgroundColor: "#252A40",
    borderWidth: 1,
    borderColor: C.line,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  levelNumber: { fontSize: 19, fontWeight: "600", color: C.ink },
  miniStars: { flexDirection: "row", gap: 2 },
  winMark: {
    width: 72,
    height: 72,
    borderRadius: 25,
    backgroundColor: "#373152",
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  winStars: {
    flexDirection: "row",
    gap: 13,
    justifyContent: "center",
    marginTop: 20,
    marginBottom: 22,
  },
  winStat: {
    padding: 17,
    borderRadius: 12,
    backgroundColor: "#282C42",
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: 20,
    marginBottom: 23,
  },
});
