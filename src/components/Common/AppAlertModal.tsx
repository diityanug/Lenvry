import React from 'react';
import { View, Text, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FadeModalHost } from './BottomSheetModal';
import { alertModalStyles as styles } from '../../styles/alertModalStyles';
import { COLORS } from '../../constants/theme';

type AlertType = 'success' | 'warning' | 'danger' | 'info';

export interface AppAlertConfig {
  visible: boolean;
  type?: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;
  onCancel?: () => void;
}

interface AppAlertModalProps {
  config: AppAlertConfig;
  onClose: () => void;
}

export default function AppAlertModal({ config, onClose }: AppAlertModalProps) {
  const type = config.type || 'info';

  const getTypeAttributes = () => {
    switch (type) {
      case 'success':
        return {
          icon: 'checkmark-circle' as const,
          iconColor: COLORS.success,
          iconBg: COLORS.successLight,
          btnBg: COLORS.success,
          btnTextColor: COLORS.textInverse,
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: COLORS.warning,
          iconBg: COLORS.warningSoft,
          btnBg: COLORS.warning,
          btnTextColor: COLORS.textInverse,
        };
      case 'danger':
        return {
          icon: 'alert-circle' as const,
          iconColor: COLORS.danger,
          iconBg: COLORS.dangerLight,
          btnBg: COLORS.danger,
          btnTextColor: COLORS.textPrimary,
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: COLORS.finance,
          iconBg: COLORS.financeLight,
          btnBg: COLORS.finance,
          btnTextColor: COLORS.textInverse,
        };
    }
  };

  const attr = getTypeAttributes();

  const handleConfirm = () => {
    if (config.onConfirm) config.onConfirm();
    onClose();
  };

  const handleCancel = () => {
    if (config.onCancel) config.onCancel();
    onClose();
  };

  return (
    <FadeModalHost
      visible={config.visible}
      onRequestClose={handleCancel}
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.card}>
              <View style={[styles.iconWrapper, { backgroundColor: attr.iconBg }]}>
                <Ionicons name={attr.icon} size={30} color={attr.iconColor} />
              </View>

              <Text style={styles.title}>{config.title}</Text>
              <Text style={styles.message}>{config.message}</Text>

              <View style={styles.buttonRow}>
                {config.cancelText && (
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={handleCancel}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.cancelBtnText}>{config.cancelText}</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  style={[styles.confirmBtn, { backgroundColor: attr.btnBg }]}
                  onPress={handleConfirm}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.confirmBtnText, { color: attr.btnTextColor }]}>
                    {config.confirmText || 'OK'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </FadeModalHost>
  );
}