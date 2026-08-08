import { View } from 'react-native';

import { colors, spacing } from '@app/theme/tokens';
import { AppText, Screen } from '@shared/ui';

export function ChatsScreen() {
  return (
    <Screen scroll={false}>
      <View style={{ flex: 1, gap: spacing.stackSm }}>
        <AppText variant="headline">Chats</AppText>
        <AppText variant="body-md" color={colors.secondaryText}>
          Your conversations will show up here.
        </AppText>
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: spacing.stackSm,
          }}
        >
          <AppText variant="headline-sm" color={colors.primaryText}>
            No chats yet
          </AppText>
          <AppText variant="body-md" color={colors.secondaryText} align="center">
            Start a conversation when you are ready.
          </AppText>
        </View>
      </View>
    </Screen>
  );
}
