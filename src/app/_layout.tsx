import React from 'react';
import { View } from 'react-native';
import { Tabs } from 'expo-router';
import CurvedTabBar from '../components/Navigation/CurvedTabBar';

export default function AppLayout() {
  return (
    <View style={{ flex: 1, backgroundColor: '#09090B' }}>
      <Tabs
        initialRouteName="index"
        backBehavior="initialRoute"
        tabBar={(props: any) => <CurvedTabBar {...props} />}
        screenOptions={{
          headerShown: false,
          animation: 'none',
        }}
      >
        <Tabs.Screen name="fitness" options={{ title: 'Fitness' }} />
        <Tabs.Screen name="habits" options={{ title: 'Habits' }} />
        <Tabs.Screen name="index" options={{ title: 'Home' }} />
        <Tabs.Screen name="finance" options={{ title: 'Finance' }} />
        <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
      </Tabs>
    </View>
  );
}