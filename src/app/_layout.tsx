import React from "react";
import { Stack } from "expo-router";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
export default function Layout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          title: "Huedrop",
          contentStyle: { backgroundColor: "#131523" },
        }}
      />
    </SafeAreaProvider>
  );
}
