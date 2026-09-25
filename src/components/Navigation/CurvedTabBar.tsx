import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { TAB_BAR_HEIGHT, CENTER_BUTTON_SIZE } from '../../constants/tabBar';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface TabItemProps {
  label: string;
  iconName: any;
  iconNameOutline: any;
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
          color={isFocused ? iconColor : '#71717A'}
        />
        <Text
          style={[
            styles.tabLabel,
            { color: isFocused ? '#FAFAFA' : '#71717A' },
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
        <Path d={d} fill="#18181B" stroke="#27272A" strokeWidth={1} />
      </Svg>

      <View style={styles.barContent}>
        {/* Fitness */}
        <TabItem
          label="Fitness"
          iconName="barbell"
          iconNameOutline="barbell-outline"
          iconColor="#FF6B00"
          isFocused={isCurrent('fitness')}
          onPress={() => navigateTo('fitness')}
        />

        {/* Habits */}
        <TabItem
          label="Habits"
          iconName="checkbox"
          iconNameOutline="checkbox-outline"
          iconColor="#8E97FD"
          isFocused={isCurrent('habits')}
          onPress={() => navigateTo('habits')}
        />

        {/* Fixed Center Space */}
        <View style={styles.centerSpace} pointerEvents="none" />

        {/* Finance */}
        <TabItem
          label="Finance"
          iconName="wallet"
          iconNameOutline="wallet-outline"
          iconColor="#38BDF8"
          isFocused={isCurrent('finance')}
          onPress={() => navigateTo('finance')}
        />

        {/* Settings */}
        <TabItem
          label="Settings"
          iconName="settings"
          iconNameOutline="settings-outline"
          iconColor="#FAFAFA"
          isFocused={isCurrent('settings')}
          onPress={() => navigateTo('settings')}
        />
      </View>

      {/* Floating Center Button: Home */}
      <TouchableOpacity
        style={[
          styles.centerButton,
          {
            borderColor: isCurrent('index') ? '#D4FF00' : '#27272A',
          },
        ]}
        onPress={() => navigateTo('index')}
        activeOpacity={0.85}
      >
        <Ionicons
          name={isCurrent('index') ? 'home' : 'home-outline'}
          size={26}
          color={isCurrent('index') ? '#D4FF00' : '#FAFAFA'}
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
    fontWeight: '600',
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
    backgroundColor: '#09090B',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
  },
});