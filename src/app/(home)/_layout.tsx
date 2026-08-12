import { Redirect, Tabs } from "expo-router";

import { useAuth } from "@/core/context/AuthContext";
import { colors, textStyle } from "@app/theme/tokens";
import { Icon } from "@shared/ui";

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
          marginBottom: 8,
        },
        tabBarActiveTintColor: colors.primaryText,
        tabBarInactiveTintColor: colors.secondaryText,
        tabBarLabelStyle: textStyle("label-sm"),
        sceneStyle: { backgroundColor: colors.primaryBackground },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="conversations"
        options={{
          title: "Chats",
          tabBarIcon: ({ color, size }) => (
            <Icon name="MessageCircle" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Search",
          tabBarIcon: ({ color, size }) => (
            <Icon name="Search" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="about"
        options={{
          title: "About",
          tabBarIcon: ({ color, size }) => (
            <Icon name="UserRound" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
