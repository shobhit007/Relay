import { Modal, Pressable, View } from 'react-native';

import { colors, radius, spacing } from '@app/theme/tokens';

import { AppText } from './AppText';
import { Button } from './Button';

type ConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmModal({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPress={onCancel}
        style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.6)',
          justifyContent: 'center',
          paddingHorizontal: spacing.containerPaddingMobile,
        }}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          style={{
            gap: spacing.stackMd,
            padding: spacing.gutter,
            borderRadius: radius.cards,
            backgroundColor: colors.secondaryBackground,
            borderWidth: 1,
            borderColor: colors.border,
          }}
        >
          <View style={{ gap: spacing.stackSm }}>
            <AppText variant="headline-sm">{title}</AppText>
            <AppText variant="body-md" color={colors.secondaryText}>
              {message}
            </AppText>
          </View>

          <View style={{ gap: spacing.stackSm }}>
            <Button
              label={confirmLabel}
              onPress={onConfirm}
              loading={loading}
            />
            <Button
              label={cancelLabel}
              variant="secondary"
              onPress={onCancel}
              disabled={loading}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
