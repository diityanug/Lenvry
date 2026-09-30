import React from 'react';
import { View, Text, Modal, TouchableOpacity, TouchableWithoutFeedback } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { alertModalStyles as styles } from '../../styles/alertModalStyles';
import { COLORS } from '../../constants/theme';

export type AlertType = 'success' | 'warning' | 'danger' | 'info';

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
          btnTextColor: '#08090C',
        };
      case 'warning':
        return {
          icon: 'warning' as const,
          iconColor: COLORS.warning,
          iconBg: 'rgba(245, 158, 11, 0.14)',
          btnBg: COLORS.warning,
          btnTextColor: '#08090C',
        };
      case 'danger':
        return {
          icon: 'alert-circle' as const,
          iconColor: COLORS.danger,
          iconBg: COLORS.dangerLight,
          btnBg: COLORS.danger,
          btnTextColor: '#FFFFFF',
        };
      case 'info':
      default:
        return {
          icon: 'information-circle' as const,
          iconColor: COLORS.finance,
          iconBg: COLORS.financeLight,
          btnBg: COLORS.finance,
          btnTextColor: '#08090C',
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
    <Modal
      animationType="fade"
      transparent={true}
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
    </Modal>
  );
}