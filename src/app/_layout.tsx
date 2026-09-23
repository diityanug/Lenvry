import { Tabs } from 'expo-router';
import { FontAwesome5 } from '@expo/vector-icons';

export default function AppLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { 
          backgroundColor: '#1E1E1E', 
          borderTopColor: '#2A2A2A',
          paddingBottom: 5,
          height: 60
        },
        tabBarActiveTintColor: '#D4FF00',
        tabBarInactiveTintColor: '#A1A1AA',
      }}
    >
      {/* Home Screen: Menjadi halaman pertama (Summary / Pengingat) */}
      <Tabs.Screen 
        name="index" 
        options={{ 
          title: 'Home',
          tabBarIcon: ({ color }) => <FontAwesome5 name="home" size={20} color={color} />
        }} 
      />
      
      {/* Gym Screen: Dipindah menjadi file gym.tsx terpisah */}
      <Tabs.Screen 
        name="gym" 
        options={{ 
          title: 'Gym',
          tabBarIcon: ({ color }) => <FontAwesome5 name="dumbbell" size={20} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="habit" 
        options={{ 
          title: 'Habit',
          tabBarIcon: ({ color }) => <FontAwesome5 name="check-square" size={20} color={color} />
        }} 
      />

      <Tabs.Screen 
        name="finance" 
        options={{ 
          title: 'Finance',
          tabBarIcon: ({ color }) => <FontAwesome5 name="wallet" size={20} color={color} />
        }} 
      />
    </Tabs>
  );
}