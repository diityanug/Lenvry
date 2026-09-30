import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { TAB_BAR_HEIGHT, CENTER_BUTTON_SIZE } from '../../constants/tabBar';
import { COLORS } from '../../constants/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItemProps {
  label: string;
  iconName: keyof typeof Ionicons.glyphMap;
  iconNameOutline: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  isFocused: boolean;
  onPress: () => void;
}

function TabItem({
  label,
  iconName,
  iconNameOutline,
  iconColor,
  isFocused,
  onPress,
}: TabItemProps) {
  return (
    <TouchableOpacity
      style={styles.tabItem}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Ionicons
          name={isFocused ? iconName : iconNameOutline}
          size={22}
          color={isFocused ? iconColor : COLORS.textMuted}
        />
        <Text
          style={[
            styles.tabLabel,
            {
              color: isFocused ? COLORS.textPrimary : COLORS.textMuted,
              fontWeight: isFocused ? '700' : '500',
            },
          ]}
          numberOfLines={1}
        >
          {label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

interface CurvedTabBarProps {
  state: any;
  navigation: any;
  descriptors?: any;
  insets?: any;
}

export default function CurvedTabBar({ state, navigation }: CurvedTabBarProps) {
  const center = SCREEN_WIDTH / 2;
  const notchRadius = 42;
  const notchDepth = 34;

  const d = `
    M 0 0
    L ${center - notchRadius - 10} 0
    C ${center - notchRadius + 8} 0, ${center - notchRadius + 12} ${notchDepth}, ${center} ${notchDepth}
    C ${center + notchRadius - 12} ${notchDepth}, ${center + notchRadius - 8} 0, ${center + notchRadius + 10} 0
    L ${SCREEN_WIDTH} 0
    L ${SCREEN_WIDTH} ${TAB_BAR_HEIGHT + 30}
    L 0 ${TAB_BAR_HEIGHT + 30}
    Z
  `;

  const navigateTo = (name: string) => {
    const isFocused = state.routes[state.index].name === name;
    if (!isFocused) {
      navigation.navigate(name);
    }
  };

  const isCurrent = (name: string) => state.routes[state.index].name === name;

  return (
    <View style={[styles.container, { height: TAB_BAR_HEIGHT }]}>
      <Svg width={SCREEN_WIDTH} height={TAB_BAR_HEIGHT + 30} style={styles.svgBg}>
        <Path d={d} fill={COLORS.bgCard} stroke={COLORS.border} strokeWidth={1} />
      </Svg>

      <View style={styles.barContent}>
        {/* Fitness */}
        <TabItem
          label="Fitness"
          iconName="barbell"
          iconNameOutline="barbell-outline"
          iconColor={COLORS.fitness}
          isFocused={isCurrent('fitness')}
          onPress={() => navigateTo('fitness')}
        />

        {/* Habits */}
        <TabItem
          label="To-Do"
          iconName="checkbox"
          iconNameOutline="checkbox-outline"
          iconColor={COLORS.habit}
          isFocused={isCurrent('habits')}
          onPress={() => navigateTo('habits')}
        />

        {/* Fixed Center Space */}
        <View style={styles.centerSpace} pointerEvents="none" />

        {/* Nutrition */}
        <TabItem
          label="Meal"
          iconName="restaurant"
          iconNameOutline="restaurant-outline"
          iconColor={COLORS.nutrition}
          isFocused={isCurrent('nutrition')}
          onPress={() => navigateTo('nutrition')}
        />

        {/* Finance */}
        <TabItem
          label="Finance"
          iconName="wallet"
          iconNameOutline="wallet-outline"
          iconColor={COLORS.finance}
          isFocused={isCurrent('finance')}
          onPress={() => navigateTo('finance')}
        />
      </View>

      {/* Floating Center Button: Home */}
      <TouchableOpacity
        style={[
          styles.centerButton,
          {
            borderColor: isCurrent('index') ? COLORS.accent : COLORS.border,
            shadowColor: isCurrent('index') ? COLORS.accent : '#000',
            shadowOpacity: isCurrent('index') ? 0.45 : 0.25,
          },
        ]}
        onPress={() => navigateTo('index')}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isCurrent('index') ? 'home' : 'home-outline'}
          size={25}
          color={isCurrent('index') ? COLORS.accent : COLORS.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    backgroundColor: 'transparent',
  },
  svgBg: {
    position: 'absolute',
    top: 0,
    left: 0,
  },
  barContent: {
    flexDirection: 'row',
    width: '100%',
    height: 68,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 6,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  centerSpace: {
    width: CENTER_BUTTON_SIZE + 16,
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 4,
    letterSpacing: 0.2,
    textAlign: 'center',
  },
  centerButton: {
    position: 'absolute',
    top: -18,
    left: '50%',
    marginLeft: -(CENTER_BUTTON_SIZE / 2),
    width: CENTER_BUTTON_SIZE,
    height: CENTER_BUTTON_SIZE,
    borderRadius: CENTER_BUTTON_SIZE / 2,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    elevation: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 6,
  },
});