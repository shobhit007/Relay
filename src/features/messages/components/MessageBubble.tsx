import { View } from 'react-native';

import { colors, radius, spacing } from '@app/theme/tokens';
import { AppText } from '@shared/ui';

import type { LocalMessage } from '../db/schema';
import { MESSAGE_STATUS } from '../db/schema';

type MessageBubbleProps = {
  message: LocalMessage;
  isOwn: boolean;
};

export function MessageBubble({ message, isOwn }: MessageBubbleProps) {
  const statusLabel =
    message.status === MESSAGE_STATUS.PENDING
      ? 'Sending…'
      : message.status === MESSAGE_STATUS.FAILED
        ? 'Failed'
        : null;

  return (
    <View
      style={{
        alignSelf: isOwn ? 'flex-end' : 'flex-start',
        maxWidth: '80%',
        marginVertical: 4,
        paddingHorizontal: spacing.stackSm,
        paddingVertical: spacing.base,
        borderRadius: radius.DEFAULT,
        backgroundColor: isOwn ? colors.accent : colors.surface,
        borderWidth: isOwn ? 0 : 1,
        borderColor: colors.border,
      }}
    >
      <AppText variant="body-md" color={colors.primaryText}>
        {message.content}
      </AppText>
      {statusLabel ? (
        <AppText
          variant="label-sm"
          color={colors.secondaryText}
          style={{ marginTop: 4, opacity: 0.8 }}
        >
          {statusLabel}
        </AppText>
      ) : null}
    </View>
  );
}
