import { Redirect, Tabs } from "expo-router";

import { useAuth } from "@/core/context/AuthContext";
import { colors, textStyle } from "@app/theme/tokens";

export default function HomeLayout() {
  const { status } = useAuth();

  if (status === "unauthenticated") {
    return <Redirect href="/(auth)/welcome" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: colors.primaryBackground },
        headerTintColor: colors.primaryText,
        headerTitleStyle: textStyle("headline-sm"),
        headerShadowVisible: false,
        tabBarStyle: {
          backgroundColor: colors.secondaryBackground,
          borderTopColor: colors.border,
        },
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: textStyle("label-sm"),
        sceneStyle: { backgroundColor: colors.primaryBackground },
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: "Chats",
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
        }}
      />
    </Tabs>
  );
}
