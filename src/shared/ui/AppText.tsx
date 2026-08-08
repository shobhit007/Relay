import { Text, useWindowDimensions, type TextProps, type TextStyle } from 'react-native';

import { colors, layout, textStyle } from '@app/theme/tokens';

type TypographyVariant =
  | 'headline-lg'
  | 'headline-lg-mobile'
  | 'headline-md'
  | 'headline-sm'
  | 'body-lg'
  | 'body-md'
  | 'label-lg'
  | 'label-sm';

type AppTextProps = TextProps & {
  variant?: TypographyVariant | 'headline';
  color?: string;
  align?: TextStyle['textAlign'];
};

export function AppText({
  variant = 'body-md',
  color = colors.primaryText,
  align,
  style,
  ...rest
}: AppTextProps) {
  const { width } = useWindowDimensions();
  const isTablet = width >= layout.tabletBreakpoint;

  const resolvedVariant: TypographyVariant =
    variant === 'headline'
      ? isTablet
        ? 'headline-lg'
        : 'headline-lg-mobile'
      : variant;

  return (
    <Text
      style={[textStyle(resolvedVariant), { color, textAlign: align }, style]}
      {...rest}
    />
  );
}
