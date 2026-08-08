import {
  ActivityIndicator,
  Pressable,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { colors, radius, textStyle, touch } from '@app/theme/tokens';

import { AppText } from './AppText';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = Omit<PressableProps, 'style' | 'children'> & {
  label: string;
  variant?: ButtonVariant;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function Button({
  label,
  variant = 'primary',
  loading = false,
  disabled,
  style,
  ...rest
}: ButtonProps) {
  const isPrimary = variant === 'primary';
  const isDisabled = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      disabled={isDisabled}
      style={({ pressed }) => [
        {
          minHeight: touch.button,
          borderRadius: radius.buttons,
          alignItems: 'center',
          justifyContent: 'center',
          paddingHorizontal: 20,
          backgroundColor: isPrimary ? colors.accent : colors.surface,
          borderWidth: isPrimary ? 0 : 1,
          borderColor: colors.border,
          opacity: isDisabled ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator
          color={isPrimary ? colors.primaryText : colors.accent}
        />
      ) : (
        <AppText
          variant="label-lg"
          color={isPrimary ? colors.primaryText : colors.primaryText}
          style={textStyle('label-lg')}
        >
          {label}
        </AppText>
      )}
    </Pressable>
  );
}
