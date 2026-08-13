import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from "@expo-google-fonts/inter";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect } from "react";
import { Platform } from "react-native";

import { useAuth } from "@/core/context/AuthContext";
import { AppProviders } from "@/core/providers/AppProviders";
import { colors } from "@app/theme/tokens";

if (Platform.OS === "web") {
  require("@/global.css");
}

SplashScreen.preventAutoHideAsync();

function RootNavigator() {
  const [fontsLoaded, fontError] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });
  const { status } = useAuth();

  useEffect(() => {
    if ((fontsLoaded || fontError) && status !== "loading") {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, status]);

  if ((!fontsLoaded && !fontError) || status === "loading") {
    return null;
  }

  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.primaryBackground },
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(home)" />
        <Stack.Screen name="chat" />
      </Stack>
    </>
  );
}

export default function RootLayout() {
  return (
    <AppProviders>
      <RootNavigator />
    </AppProviders>
  );
}
