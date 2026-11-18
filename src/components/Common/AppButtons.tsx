import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  TouchableOpacity,
  ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';

const DEFAULT_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };
const ICON_HIT_SLOP = { top: 8, bottom: 8, left: 8, right: 8 };

export interface HeaderActionButtonProps {
  label: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  iconSize?: number;
  variant?: 'primary' | 'secondary';
  color?: string;
  iconColor?: string;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared top-right header action button used uniformly across screens
 * (`+ Add`, `Presets`, `Goals`) while letting each section supply its own
 * handler, icon, label, and accent color.
 */
export function HeaderActionButton({
  label,
  onPress,
  icon = 'add',
  iconSize,
  variant = 'primary',
  color = COLORS.accent,
  iconColor,
  accessibilityLabel,
  style,
}: HeaderActionButtonProps) {
  const isPrimary = variant === 'primary';
  const resolvedIconSize = iconSize ?? (isPrimary ? 16 : 15);
  const resolvedIconColor =
    iconColor ?? (isPrimary ? COLORS.textInverse : COLORS.textSecondary);

  return (
    <TouchableOpacity
      style={[
        styles.headerBtnBase,
        isPrimary ? { backgroundColor: color } : styles.headerBtnSecondary,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.8}
      hitSlop={DEFAULT_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Ionicons name={icon} size={resolvedIconSize} color={resolvedIconColor} />
      <Text
        style={[
          styles.headerBtnText,
          isPrimary ? styles.headerBtnPrimaryText : styles.headerBtnSecondaryText,
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export interface SectionAddButtonProps {
  label: string;
  onPress: () => void;
  color?: string;
  icon?: keyof typeof Ionicons.glyphMap;
  surface?: 'card' | 'sub';
  borderColor?: string;
  variant?: 'default' | 'compactDashed';
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared full-width "+ Add ..." bar used inside Home, Nutrition, and Finance
 * sections for consistent height, radius, border, and typography.
 */
export function SectionAddButton({
  label,
  onPress,
  color = COLORS.accentHover,
  icon,
  surface = 'card',
  borderColor,
  variant = 'default',
  accessibilityLabel,
  style,
}: SectionAddButtonProps) {
  const isCompact = variant === 'compactDashed';
  const resolvedIcon = icon ?? (isCompact ? 'add' : 'add-circle');
  const resolvedIconSize = isCompact ? 15 : 18;
  const resolvedBg = surface === 'sub' ? COLORS.bgCardSub : COLORS.bgCard;

  return (
    <TouchableOpacity
      style={[
        isCompact ? styles.sectionAddCompact : styles.sectionAddBase,
        { backgroundColor: resolvedBg },
        borderColor ? { borderColor } : null,
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.75}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || label}
    >
      <Ionicons name={resolvedIcon} size={resolvedIconSize} color={color} />
      <Text
        style={[
          isCompact ? styles.sectionAddCompactText : styles.sectionAddText,
          { color },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export interface CardIconButtonProps {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  tone?: 'default' | 'surfaceCard' | 'danger';
  iconColor?: string;
  iconSize?: number;
  size?: number;
  rounded?: boolean;
  accessibilityLabel?: string;
  style?: StyleProp<ViewStyle>;
}

/**
 * Shared compact square/circle icon button used for Edit, Copy, Delete, and
 * utility actions inside cards, modal headers, and screen headers.
 */
export function CardIconButton({
  icon,
  onPress,
  tone = 'default',
  iconColor,
  iconSize = 15,
  size = 34,
  rounded = false,
  accessibilityLabel,
  style,
}: CardIconButtonProps) {
  const resolvedColor =
    iconColor ?? (tone === 'danger' ? COLORS.danger : COLORS.textSecondary);

  const toneStyle =
    tone === 'danger'
      ? styles.iconBtnDanger
      : tone === 'surfaceCard'
        ? styles.iconBtnSurfaceCard
        : styles.iconBtnDefault;

  return (
    <TouchableOpacity
      style={[
        styles.iconBtnBase,
        toneStyle,
        {
          width: size,
          height: size,
          borderRadius: rounded ? RADIUS.full : RADIUS.sm,
        },
        style,
      ]}
      onPress={onPress}
      activeOpacity={0.7}
      hitSlop={ICON_HIT_SLOP}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
    >
      <Ionicons name={icon} size={iconSize} color={resolvedColor} />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  headerBtnBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 38,
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: RADIUS.md,
    gap: 5,
  },
  headerBtnSecondary: {
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  headerBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerBtnPrimaryText: {
    color: COLORS.textInverse,
  },
  headerBtnSecondaryText: {
    color: COLORS.textPrimary,
  },
  sectionAddBase: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  sectionAddText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  sectionAddCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 40,
    paddingVertical: 9,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: 'dashed',
    gap: 6,
  },
  sectionAddCompactText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  iconBtnBase: {
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  iconBtnDefault: {
    backgroundColor: COLORS.bgCardSub,
    borderColor: COLORS.border,
  },
  iconBtnSurfaceCard: {
    backgroundColor: COLORS.bgCard,
    borderColor: COLORS.border,
  },
  iconBtnDanger: {
    backgroundColor: '#FCECEC',
    borderColor: 'rgba(201, 59, 59, 0.25)',
  },
});
