import { Image } from 'expo-image';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  View,
} from 'react-native';

import { conversationService } from '@features/conversations';
import { useUser } from '@features/user';
import { colors, radius, spacing } from '@app/theme/tokens';
import { ApiError } from '@shared/api';
import { AppText, Screen, TextField } from '@shared/ui';

import { searchUsers } from '../api/search.api';
import type { SearchUser } from '../types/search.types';

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

function SearchUserRow({
  item,
  onPress,
}: {
  item: SearchUser;
  onPress: (user: SearchUser) => void;
}) {
  const avatarUrl = item.avatarUrl?.trim() || null;

  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => onPress(item)}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
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
            recyclingKey={item.id}
          />
        ) : (
          <AppText variant="label-lg">
            {initialsFor(item.displayName)}
          </AppText>
        )}
      </View>

      <View style={{ flex: 1, gap: spacing.base / 2 }}>
        <AppText variant="headline-sm" numberOfLines={1}>
          {item.displayName}
        </AppText>
        <AppText variant="body-md" color={colors.secondaryText} numberOfLines={1}>
          @{item.username}
        </AppText>
      </View>
    </Pressable>
  );
}

export function SearchScreen() {
  const router = useRouter();
  const { currentUserId } = useUser();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openingUserId, setOpeningUserId] = useState<string | null>(null);

  useEffect(() => {
    const trimmed = query.trim();
    let cancelled = false;

    if (trimmed.length === 0) {
      setResults([]);
      setError(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const timeoutId = setTimeout(async () => {
      try {
        const users = await searchUsers(trimmed);
        if (cancelled) return;
        setResults(users);
      } catch (err) {
        if (cancelled) return;
        const message =
          err instanceof ApiError
            ? err.message
            : 'Unable to search users. Please try again.';
        setError(message);
        setResults([]);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [query]);

  async function onSelectUser(user: SearchUser) {
    if (!currentUserId || openingUserId) {
      return;
    }

    setOpeningUserId(user.id);
    setError(null);

    try {
      const result = await conversationService.resolveChatWithUser(
        currentUserId,
        {
          id: user.id,
          username: user.username,
          displayName: user.displayName,
          avatarUrl: user.avatarUrl,
        },
      );

      if (result.mode === 'existing') {
        router.push(
          `/chat?conversationId=${encodeURIComponent(result.conversationId)}` as Href,
        );
      } else {
        router.push(
          `/chat?userId=${encodeURIComponent(result.userId)}` as Href,
        );
      }
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : 'Unable to open chat. Please try again.';
      setError(message);
    } finally {
      setOpeningUserId(null);
    }
  }

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: spacing.stackMd }}>
        <TextField
          label="Username"
          displayLabel={false}
          value={query}
          onChangeText={setQuery}
          placeholder="Search for a username"
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />

        {error ? (
          <AppText variant="label-sm" color={colors.error}>
            {error}
          </AppText>
        ) : null}

        {loading ? (
          <View
            style={{
              flex: 1,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ActivityIndicator color={colors.primaryText} />
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              gap: spacing.stackSm,
              paddingBottom: spacing.stackMd,
            }}
            ListEmptyComponent={
              query.trim().length > 0 ? (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.stackSm,
                    paddingTop: spacing.stackLg,
                  }}
                >
                  <AppText variant="headline-sm" color={colors.primaryText}>
                    No users found
                  </AppText>
                  <AppText
                    variant="body-md"
                    color={colors.secondaryText}
                    align="center"
                  >
                    Try a different username.
                  </AppText>
                </View>
              ) : (
                <View
                  style={{
                    flex: 1,
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: spacing.stackSm,
                    paddingTop: spacing.stackLg,
                  }}
                >
                  <AppText variant="body-md" color={colors.secondaryText}>
                    Start typing a username to search.
                  </AppText>
                </View>
              )
            }
            renderItem={({ item }) => (
              <SearchUserRow item={item} onPress={onSelectUser} />
            )}
          />
        )}
      </View>
    </Screen>
  );
}
