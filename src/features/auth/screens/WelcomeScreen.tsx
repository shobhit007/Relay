import { View } from 'react-native';

import { colors, spacing } from '@app/theme/tokens';
import { useOnceRouter } from '@shared/hooks';
import { AppText, Button, Screen } from '@shared/ui';

export function WelcomeScreen() {
  const { pushOnce } = useOnceRouter();

  return (
    <Screen contentStyle={{ justifyContent: 'space-between' }}>
      <View style={{ flex: 1, justifyContent: 'center', gap: spacing.stackSm }}>
        <AppText variant="headline" color={colors.primaryText}>
          Relay
        </AppText>
        <AppText variant="body-lg" color={colors.secondaryText}>
          Private conversations, built for clarity.
        </AppText>
      </View>

      <View style={{ gap: spacing.stackSm, paddingBottom: spacing.stackMd }}>
        <Button label="Log in" onPress={() => pushOnce('/(auth)/login')} />
        <Button
          label="Sign up"
          variant="secondary"
          onPress={() => pushOnce('/(auth)/signup')}
        />
      </View>
    </Screen>
  );
}
