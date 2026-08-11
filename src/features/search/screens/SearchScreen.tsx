import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, View } from "react-native";

import { colors, radius, spacing } from "@app/theme/tokens";
import { ApiError } from "@shared/api";
import { AppText, Screen, TextField } from "@shared/ui";

import { searchUsers } from "../api/search.api";
import type { SearchUser } from "../types/search.types";

export function SearchScreen() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
            : "Unable to search users. Please try again.";
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

  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: spacing.stackMd }}>
        {/* <View style={{ gap: spacing.stackSm }}>
          <AppText variant="headline">Search</AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            Find people by username.
          </AppText>
        </View> */}

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
              alignItems: "center",
              justifyContent: "center",
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
                    alignItems: "center",
                    justifyContent: "center",
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
                    alignItems: "center",
                    justifyContent: "center",
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
              <View
                style={{
                  gap: spacing.base,
                  padding: spacing.gutter,
                  borderRadius: radius.cards,
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <AppText variant="headline-sm">{item.displayName}</AppText>
                <AppText variant="body-md" color={colors.secondaryText}>
                  @{item.username}
                </AppText>
              </View>
            )}
          />
        )}
      </View>
    </Screen>
  );
}
