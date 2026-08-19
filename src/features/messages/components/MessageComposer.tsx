import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing, textStyle, touch } from '@app/theme/tokens';
import { AppText } from '@shared/ui';

type MessageComposerProps = {
  disabled?: boolean;
  sending?: boolean;
  onSend: (content: string) => Promise<void> | void;
};

export function MessageComposer({
  disabled = false,
  sending = false,
  onSend,
}: MessageComposerProps) {
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');

  async function handleSend() {
    const content = text.trim();
    if (!content || disabled || sending) {
      return;
    }

    setText('');
    await onSend(content);
  }

  const canSend = text.trim().length > 0 && !disabled && !sending;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: spacing.stackSm,
        paddingHorizontal: spacing.containerPaddingMobile,
        paddingTop: spacing.stackSm,
        paddingBottom: Math.max(insets.bottom, spacing.stackSm),
        borderTopWidth: 1,
        borderTopColor: colors.border,
        backgroundColor: colors.secondaryBackground,
      }}
    >
      <TextInput
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={colors.placeholder}
        editable={!disabled && !sending}
        multiline
        style={{
          flex: 1,
          minHeight: touch.min,
          maxHeight: 120,
          paddingHorizontal: spacing.stackSm,
          paddingVertical: spacing.base,
          borderRadius: radius.inputs,
          borderWidth: 1,
          borderColor: colors.border,
          backgroundColor: colors.surface,
          color: colors.primaryText,
          ...textStyle('body-md'),
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        disabled={!canSend}
        onPress={() => {
          void handleSend();
        }}
        style={{
          minWidth: touch.button,
          minHeight: touch.button,
          borderRadius: radius.buttons,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: spacing.stackSm,
          backgroundColor: canSend ? colors.accent : colors.surface,
          opacity: canSend ? 1 : 0.5,
        }}
      >
        {sending ? (
          <ActivityIndicator color={colors.primaryText} />
        ) : (
          <AppText
            variant="label-lg"
            color={canSend ? colors.primaryText : colors.secondaryText}
          >
            Send
          </AppText>
        )}
      </Pressable>
    </View>
  );
}
