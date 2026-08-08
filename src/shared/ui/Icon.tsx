import * as LucideIcons from 'lucide-react-native/icons';
import type { ComponentProps } from 'react';
import type { ColorValue } from 'react-native';

import { colors } from '@app/theme/tokens';

export type IconName = keyof typeof LucideIcons;

type LucideIconProps = ComponentProps<(typeof LucideIcons)[IconName]>;

export type IconProps = {
  name: IconName;
  /** When true, fills the icon with `color` (useful for active tab states). */
  filled?: boolean;
  color?: ColorValue;
} & Omit<LucideIconProps, 'color' | 'fill'> & {
    fill?: ColorValue;
  };

export function Icon({
  name,
  color = colors.primaryText,
  size = 24,
  filled = false,
  fill,
  ...rest
}: IconProps) {
  const LucideIcon = LucideIcons[name];

  if (!LucideIcon) {
    if (__DEV__) {
      console.warn(`[Icon] Unknown icon name: ${String(name)}`);
    }
    return null;
  }

  return (
    <LucideIcon
      color={color}
      size={size}
      fill={fill ?? (filled ? color : 'none')}
      {...rest}
    />
  );
}
