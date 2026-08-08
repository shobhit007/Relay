import { View } from 'react-native';
import { useRouter } from 'expo-router';

import { useAuth } from '@/core/context/AuthContext';
import { colors, radius, spacing } from '@app/theme/tokens';
import { AppText, Button, Screen } from '@shared/ui';

export function AboutScreen() {
  const router = useRouter();
  const { user, signOut } = useAuth();

  async function onSignOut() {
    await signOut();
    router.replace('/(auth)/welcome');
  }

  return (
    <Screen>
      <View style={{ flex: 1, gap: spacing.stackMd }}>
        <View style={{ gap: spacing.stackSm }}>
          <AppText variant="headline">About</AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            Relay keeps your conversations private and focused.
          </AppText>
        </View>

        <View
          style={{
            gap: spacing.stackSm,
            padding: spacing.gutter,
            borderRadius: radius.cards,
            backgroundColor: colors.surface,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <AppText variant="label-lg" color={colors.secondaryText}>
            Signed in as
          </AppText>
          <AppText variant="headline-sm">{user?.displayName ?? '—'}</AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            @{user?.username ?? '—'}
          </AppText>
          <AppText variant="body-md" color={colors.secondaryText}>
            {user?.email ?? '—'}
          </AppText>
        </View>

        <View style={{ flex: 1 }} />

        <Button label="Sign out" variant="secondary" onPress={onSignOut} />
      </View>
    </Screen>
  );
}
