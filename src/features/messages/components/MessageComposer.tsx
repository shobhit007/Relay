import { useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  TextInput,
  View,
  type TextInput as TextInputType,
} from "react-native";
import { useKeyboardState } from "react-native-keyboard-controller";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { colors, radius, spacing, textStyle, touch } from "@app/theme/tokens";
import { Icon } from "@shared/ui";

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
  const isKeyboardVisible = useKeyboardState((state) => state.isVisible);
  const inputRef = useRef<TextInputType>(null);
  const [text, setText] = useState("");

  async function handleSend() {
    const content = text.trim();
    if (!content || disabled || sending) {
      return;
    }

    setText("");
    // Keep focus through send so the keyboard stays open.
    inputRef.current?.focus();
    await onSend(content);
    requestAnimationFrame(() => {
      inputRef.current?.focus();
    });
  }

  const canSend = text.trim().length > 0 && !disabled && !sending;
  const bottomPadding = isKeyboardVisible
    ? spacing.stackMd
    : Math.max(insets.bottom, spacing.stackSm) + spacing.stackSm;

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "flex-end",
        gap: spacing.stackSm,
        paddingHorizontal: spacing.containerPaddingMobile,
        paddingTop: spacing.stackSm,
        paddingBottom: bottomPadding,
        backgroundColor: colors.primaryBackground,
      }}
    >
      <TextInput
        ref={inputRef}
        value={text}
        onChangeText={setText}
        placeholder="Message"
        placeholderTextColor={colors.placeholder}
        editable={!disabled}
        blurOnSubmit={false}
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
          ...textStyle("body-md"),
        }}
      />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send message"
        disabled={!canSend}
        hitSlop={8}
        onPress={() => {
          void handleSend();
        }}
        style={{
          minWidth: touch.min,
          minHeight: touch.min,
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 4,
          opacity: canSend ? 1 : 0.4,
        }}
      >
        {sending ? (
          <ActivityIndicator color={colors.accent} />
        ) : (
          <Icon
            name="SendHorizontal"
            size={24}
            color={canSend ? colors.accent : colors.secondaryText}
            fill={canSend ? colors.accent : colors.secondaryText}
          />
        )}
      </Pressable>
    </View>
  );
}
