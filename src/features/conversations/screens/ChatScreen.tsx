import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useUser } from '@features/user';
import { colors, radius, spacing } from '@app/theme/tokens';
import { AppText } from '@shared/ui';

import { conversationService } from '../services/conversation.service';
import type { ChatPeerUser } from '../types/conversations.types';

function initialsFor(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return '?';
  }
  if (parts.length === 1) {
    return parts[0].slice(0, 2).toUpperCase();
  }
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }
  return value;
}

export function ChatScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { currentUserId } = useUser();
  const params = useLocalSearchParams<{
    conversationId?: string | string[];
    userId?: string | string[];
  }>();

  const conversationId = firstParam(params.conversationId);
  const userId = firstParam(params.userId);
  const isTemporary = !conversationId && Boolean(userId);

  const [peer, setPeer] = useState<ChatPeerUser | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadPeer() {
      if (!currentUserId) {
        setPeer(null);
        return;
      }

      const next = await conversationService.getChatPeer(currentUserId, {
        conversationId,
        userId,
      });

      if (!cancelled) {
        setPeer(next);
      }
    }

    void loadPeer();

    return () => {
      cancelled = true;
    };
  }, [conversationId, currentUserId, userId]);

  const avatarUrl = peer?.avatarUrl?.trim() || null;

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.primaryBackground,
        paddingTop: insets.top,
      }}
    >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.stackSm,
          paddingHorizontal: spacing.containerPaddingMobile,
          paddingVertical: spacing.stackSm,
          borderBottomWidth: 1,
          borderBottomColor: colors.border,
          backgroundColor: colors.secondaryBackground,
        }}
      >
        <Pressable
          accessibilityRole="button"
          hitSlop={8}
          onPress={() => router.back()}
          style={{ minWidth: 44, minHeight: 44, justifyContent: 'center' }}
        >
          <AppText variant="label-lg" color={colors.accent}>
            Back
          </AppText>
        </Pressable>

        <View
          style={{
            width: 40,
            height: 40,
            borderRadius: radius.rounded,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden',
          }}
        >
          {avatarUrl ? (
            <Image
              source={{ uri: avatarUrl }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
              recyclingKey={peer?.id}
            />
          ) : (
            <AppText variant="label-sm">
              {initialsFor(peer?.displayName ?? '?')}
            </AppText>
          )}
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="headline-sm" numberOfLines={1}>
            {peer?.displayName ?? 'Chat'}
          </AppText>
          {peer?.username ? (
            <AppText variant="label-sm" color={colors.secondaryText} numberOfLines={1}>
              @{peer.username}
            </AppText>
          ) : null}
        </View>
      </View>

      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: spacing.stackSm,
          paddingHorizontal: spacing.containerPaddingMobile,
        }}
      >
        <AppText variant="headline-sm" color={colors.primaryText}>
          No messages yet
        </AppText>
        <AppText variant="body-md" color={colors.secondaryText} align="center">
          {isTemporary
            ? 'This is a temporary chat. A conversation will be created when you send a message.'
            : 'Say hello to start the conversation.'}
        </AppText>
      </View>
    </View>
  );
}
