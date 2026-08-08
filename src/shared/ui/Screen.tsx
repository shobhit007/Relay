import type { ReactNode } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { colors, layout, spacing } from '@app/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  scroll?: boolean;
  style?: StyleProp<ViewStyle>;
  contentStyle?: StyleProp<ViewStyle>;
  keyboardVerticalOffset?: number;
};

export function Screen({
  children,
  scroll = true,
  style,
  contentStyle,
  keyboardVerticalOffset = 0,
}: ScreenProps) {
  const insets = useSafeAreaInsets();

  const paddedContent = (
    <View
      style={[
        {
          width: '100%',
          maxWidth: layout.maxContentWidth,
          alignSelf: 'center',
          flexGrow: 1,
          paddingHorizontal: spacing.containerPaddingMobile,
          paddingTop: spacing.stackMd,
          paddingBottom: spacing.stackMd + insets.bottom,
        },
        contentStyle,
      ]}
    >
      {children}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[
        {
          flex: 1,
          backgroundColor: colors.primaryBackground,
          paddingTop: insets.top,
        },
        style,
      ]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={keyboardVerticalOffset}
    >
      {scroll ? (
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          {paddedContent}
        </ScrollView>
      ) : (
        paddedContent
      )}
    </KeyboardAvoidingView>
  );
}
