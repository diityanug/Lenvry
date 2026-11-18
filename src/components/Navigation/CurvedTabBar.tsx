import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  useWindowDimensions,
} from 'react-native';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { CENTER_BUTTON_SIZE } from '../../constants/tabBar';
import { COLORS } from '../../constants/theme';

type CurvedTabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

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
      accessibilityRole="tab"
      accessibilityState={{ selected: isFocused }}
      accessibilityLabel={label}
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
              fontWeight: isFocused ? '600' : '500',
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

export default function CurvedTabBar({ state, emitter, navigateToTab }: CurvedTabBarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const bottomInset = Platform.OS === 'ios' ? Math.max(insets.bottom, 20) : insets.bottom;
  const barHeight = 68 + bottomInset;

  const center = screenWidth / 2;
  const notchRadius = 42;
  const notchDepth = 34;

  const d = `
    M 0 0
    L ${center - notchRadius - 10} 0
    C ${center - notchRadius + 8} 0, ${center - notchRadius + 12} ${notchDepth}, ${center} ${notchDepth}
    C ${center + notchRadius - 12} ${notchDepth}, ${center + notchRadius - 8} 0, ${center + notchRadius + 10} 0
    L ${screenWidth} 0
    L ${screenWidth} ${barHeight + 30}
    L 0 ${barHeight + 30}
    Z
  `;

  const activeRouteName = state.routes[state.index]?.name;
  const isCurrent = (name: string) => activeRouteName === name;

  const navigateTo = (name: string) => {
    const targetRoute = state.routes.find((route) => route.name === name);
    if (!targetRoute || isCurrent(name)) {
      return;
    }

    const event = emitter.emit({
      type: 'tabPress',
      target: targetRoute.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigateToTab(targetRoute.key);
    }
  };

  return (
    <View style={[styles.container, { height: barHeight, paddingBottom: bottomInset }]}>
      <Svg width={screenWidth} height={barHeight + 30} style={styles.svgBg}>
        <Path d={d} fill={COLORS.bgCard} stroke={COLORS.borderLight} strokeWidth={1} />
      </Svg>

      <View style={styles.barContent}>
        <TabItem
          label="Fitness"
          iconName="barbell"
          iconNameOutline="barbell-outline"
          iconColor={COLORS.fitness}
          isFocused={isCurrent('fitness')}
          onPress={() => navigateTo('fitness')}
        />

        <TabItem
          label="To-Do"
          iconName="checkbox"
          iconNameOutline="checkbox-outline"
          iconColor={COLORS.habit}
          isFocused={isCurrent('habits')}
          onPress={() => navigateTo('habits')}
        />

        <View style={styles.centerSpace} pointerEvents="none" />

        <TabItem
          label="Meal"
          iconName="restaurant"
          iconNameOutline="restaurant-outline"
          iconColor={COLORS.nutrition}
          isFocused={isCurrent('nutrition')}
          onPress={() => navigateTo('nutrition')}
        />

        <TabItem
          label="Finance"
          iconName="wallet"
          iconNameOutline="wallet-outline"
          iconColor={COLORS.finance}
          isFocused={isCurrent('finance')}
          onPress={() => navigateTo('finance')}
        />
      </View>

      <TouchableOpacity
        style={[
          styles.centerButton,
          {
            backgroundColor: isCurrent('index') ? COLORS.accent : COLORS.bgCardSub,
            borderColor: isCurrent('index') ? COLORS.accentHover : COLORS.borderLight,
            shadowColor: '#000',
            shadowOpacity: isCurrent('index') ? 0.25 : 0.18,
          },
        ]}
        onPress={() => navigateTo('index')}
        activeOpacity={0.85}
        accessibilityRole="tab"
        accessibilityState={{ selected: isCurrent('index') }}
        accessibilityLabel="Home"
      >
        <Ionicons
          name={isCurrent('index') ? 'home' : 'home-outline'}
          size={24}
          color={isCurrent('index') ? COLORS.textInverse : COLORS.textSecondary}
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
