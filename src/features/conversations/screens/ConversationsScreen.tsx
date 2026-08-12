import { Image } from "expo-image";
import { FlatList, View } from "react-native";

import { colors, radius, spacing } from "@app/theme/tokens";
import { AppText, Screen } from "@shared/ui";

import { useChatList } from "../hooks/useChatList";
import type { ChatListItem } from "../types/conversations.types";
import { formatChatTime } from "../utils/format-chat-time";

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
}

function ChatRow({ item }: { item: ChatListItem }) {
  const preview = item.lastMessage?.preview ?? "No messages yet";
  const time = formatChatTime(item.lastMessage?.createdAt);
  const avatarUrl = item.user.avatarUrl?.trim() || null;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        gap: spacing.stackSm,
        paddingVertical: spacing.stackSm,
      }}
    >
      <View
        style={{
          width: 52,
          height: 52,
          borderRadius: radius.rounded,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        }}
      >
        {avatarUrl ? (
          <Image
            source={{ uri: avatarUrl }}
            style={{ width: "100%", height: "100%" }}
            contentFit="cover"
            recyclingKey={item.user.id}
          />
        ) : (
          <AppText variant="label-lg">
            {initialsFor(item.user.displayName)}
          </AppText>
        )}
      </View>

      <View style={{ flex: 1, gap: spacing.base / 2 }}>
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.stackSm,
          }}
        >
          <AppText variant="headline-sm" numberOfLines={1} style={{ flex: 1 }}>
            {item.user.displayName}
          </AppText>
          {time ? (
            <AppText variant="label-sm" color={colors.secondaryText}>
              {time}
            </AppText>
          ) : null}
        </View>

        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-between",
            gap: spacing.stackSm,
          }}
        >
          <AppText
            variant="body-md"
            color={colors.secondaryText}
            numberOfLines={1}
            style={{ flex: 1 }}
          >
            {preview}
          </AppText>
          {item.unreadCount > 0 ? (
            <View
              style={{
                minWidth: 22,
                paddingHorizontal: 6,
                height: 22,
                borderRadius: 11,
                backgroundColor: colors.accent,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <AppText variant="label-sm">{item.unreadCount}</AppText>
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

export function ConversationsScreen() {
  const chats = useChatList();

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: spacing.stackMd }}>
        <AppText variant="headline">Chats</AppText>

        <FlatList
          data={chats}
          keyExtractor={(item) => item.conversationId}
          contentContainerStyle={{
            flexGrow: 1,
            gap: spacing.stackSm,
            paddingBottom: spacing.stackMd,
          }}
          ListEmptyComponent={
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
                gap: spacing.stackSm,
                paddingTop: spacing.stackLg,
              }}
            >
              <AppText variant="headline-sm" color={colors.primaryText}>
                No chats yet
              </AppText>
              <AppText
                variant="body-md"
                color={colors.secondaryText}
                align="center"
              >
                Start a conversation when you are ready.
              </AppText>
            </View>
          }
          renderItem={({ item }) => <ChatRow item={item} />}
        />
      </View>
    </Screen>
  );
}
