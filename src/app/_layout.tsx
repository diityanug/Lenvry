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
      <Tabs.Screen 
        name="index" 
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
      <Tabs.Screen 
        name="nutrition" 
        options={{ 
          title: 'NutriGo',
          tabBarIcon: ({ color }) => <FontAwesome5 name="utensils" size={20} color={color} />
        }} 
      />
    </Tabs>
  );
}