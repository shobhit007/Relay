import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { Animated, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, radius, spacing } from '@app/theme/tokens';
import { AppText } from '@shared/ui';

import { bindToastListener } from './toast-bridge';

type ToastProviderProps = {
  children: ReactNode;
};

export function ToastProvider({ children }: ToastProviderProps) {
  const insets = useSafeAreaInsets();
  const [message, setMessage] = useState<string | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    bindToastListener((nextMessage) => {
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }

      setMessage(nextMessage);
      opacity.setValue(0);

      Animated.timing(opacity, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }).start();

      hideTimer.current = setTimeout(() => {
        Animated.timing(opacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }).start(({ finished }) => {
          if (finished) {
            setMessage(null);
          }
        });
      }, 3000);
    });

    return () => {
      bindToastListener(null);
      if (hideTimer.current) {
        clearTimeout(hideTimer.current);
      }
    };
  }, [opacity]);

  return (
    <View style={{ flex: 1 }}>
      {children}
      {message ? (
        <Animated.View
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: spacing.containerPaddingMobile,
            right: spacing.containerPaddingMobile,
            bottom: Math.max(insets.bottom, spacing.stackMd) + spacing.stackSm,
            alignItems: 'center',
            opacity,
          }}
        >
          <View
            style={{
              maxWidth: '100%',
              paddingHorizontal: spacing.gutter,
              paddingVertical: spacing.stackSm,
              borderRadius: radius.cards,
              backgroundColor: colors.surface,
              borderWidth: 1,
              borderColor: colors.border,
            }}
          >
            <AppText variant="label-sm" color={colors.primaryText} align="center">
              {message}
            </AppText>
          </View>
        </Animated.View>
      ) : null}
    </View>
  );
}
