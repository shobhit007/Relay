import { useRouter } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';

import { useAuth } from '@/core/context/AuthContext';
import { useCurrentUser } from '@features/user';
import { colors, radius, spacing } from '@app/theme/tokens';
import { AppText, Button, ConfirmModal, Screen } from '@shared/ui';

export function AboutScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const user = useCurrentUser();
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function onConfirmSignOut() {
    setSigningOut(true);
    try {
      await signOut();
      setConfirmVisible(false);
      router.replace('/(auth)/welcome');
    } finally {
      setSigningOut(false);
    }
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
        </View>

        <View style={{ flex: 1 }} />

        <Button
          label="Sign out"
          variant="secondary"
          onPress={() => setConfirmVisible(true)}
        />
      </View>

      <ConfirmModal
        visible={confirmVisible}
        title="Sign out?"
        message="You will need to log in again to access your chats."
        confirmLabel="Sign out"
        cancelLabel="Cancel"
        loading={signingOut}
        onConfirm={onConfirmSignOut}
        onCancel={() => {
          if (!signingOut) {
            setConfirmVisible(false);
          }
        }}
      />
    </Screen>
  );
}
