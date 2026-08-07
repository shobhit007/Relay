import { Text, useWindowDimensions, View } from 'react-native';

import { colors, layout, spacing, textStyle } from '@app/theme/tokens';

export default function Index() {
  const { width } = useWindowDimensions();
  const isTablet = width >= layout.tabletBreakpoint;
  const headline = textStyle(isTablet ? 'headline-lg' : 'headline-lg-mobile');
  const body = textStyle('body-md');

  return (
    <View
      style={{
        flex: 1,
        backgroundColor: colors.primaryBackground,
        paddingHorizontal: spacing.containerPaddingMobile,
        paddingVertical: spacing.stackMd,
        alignItems: 'center',
      }}
    >
      <View style={{ width: '100%', maxWidth: layout.maxContentWidth, gap: spacing.stackSm }}>
        <Text style={{ ...headline, color: colors.primaryText }}>Relay</Text>
        <Text style={{ ...body, color: colors.secondaryText }}>
          Design tokens are active across the app.
        </Text>
      </View>
    </View>
  );
}
