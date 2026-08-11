import { useState } from "react";
import {
  Pressable,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type ViewStyle,
} from "react-native";

import { colors, radius, spacing, textStyle, touch } from "@app/theme/tokens";

import { AppText } from "./AppText";

type TextFieldProps = Omit<TextInputProps, "style"> & {
  label: string;
  /** When false, the visible label is not rendered. Defaults to true. */
  displayLabel?: boolean;
  error?: string;
  containerStyle?: StyleProp<ViewStyle>;
};

export function TextField({
  label,
  displayLabel = true,
  error,
  containerStyle,
  secureTextEntry,
  accessibilityLabel,
  ...rest
}: TextFieldProps) {
  const [hidden, setHidden] = useState(Boolean(secureTextEntry));
  const showToggle = Boolean(secureTextEntry);

  return (
    <View style={[{ gap: spacing.base }, containerStyle]}>
      {displayLabel ? (
        <AppText variant="label-lg" color={colors.secondaryText}>
          {label}
        </AppText>
      ) : null}
      <View
        style={{
          minHeight: touch.button,
          borderRadius: radius.inputs,
          borderWidth: 1,
          borderColor: error ? colors.error : colors.border,
          backgroundColor: colors.surface,
          paddingHorizontal: spacing.gutter,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.stackSm,
        }}
      >
        <TextInput
          placeholderTextColor={colors.placeholder}
          secureTextEntry={showToggle ? hidden : false}
          autoCapitalize="none"
          autoCorrect={false}
          accessibilityLabel={accessibilityLabel ?? label}
          style={[
            textStyle("body-md"),
            {
              flex: 1,
              color: colors.primaryText,
              paddingVertical: spacing.stackSm,
              // Prevent iOS zoom; design body-md is already 16.
              fontSize: 16,
            },
          ]}
          {...rest}
        />
        {showToggle ? (
          <Pressable
            accessibilityRole="button"
            hitSlop={8}
            onPress={() => setHidden((value) => !value)}
            style={{ minHeight: touch.min, justifyContent: "center" }}
          >
            <AppText variant="label-sm" color={colors.accent}>
              {hidden ? "Show" : "Hide"}
            </AppText>
          </Pressable>
        ) : null}
      </View>
      {error ? (
        <AppText variant="label-sm" color={colors.error}>
          {error}
        </AppText>
      ) : null}
    </View>
  );
}
