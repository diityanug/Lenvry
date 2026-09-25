import React, { useState, useCallback } from 'react';
import { View, Text, SafeAreaView, ScrollView, TouchableOpacity, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, Href, useFocusEffect } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { formatDateKey } from '../constants/habits';
import { TAB_BAR_HEIGHT } from '../constants/tabBar';
import { homeStyles as styles } from '../styles/homeStyles';
import BentoGrid from '../components/Home/BentoGrid';

const USERNAME_KEY = '@wakemove_user_name';

export default function HomeScreen() {
  const [userName, setUserName] = useState('User');

  const [todayExpenses, setTodayExpenses] = useState(0);
  const [habitCompletedCount, setHabitCompletedCount] = useState(0);
  const [habitTotalCount, setHabitTotalCount] = useState(0);
  const [todayWorkoutCount, setTodayWorkoutCount] = useState(0);
  const [todayWorkoutTitle, setTodayWorkoutTitle] = useState('Rest Day');
  const [todayWorkoutSub, setTodayWorkoutSub] = useState('No workouts recorded');

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric',
  });

  const fetchDashboardData = async () => {
    try {
      const storedName = await AsyncStorage.getItem(USERNAME_KEY);
      if (storedName) {
        setUserName(storedName);
      }

      const todayDateObj = new Date();
      const habitKey = formatDateKey(todayDateObj);
      const fitnessKey = todayDateObj.toISOString().split('T')[0];

      // Finance
      const storedTx = await AsyncStorage.getItem('@finance_tx');
      if (storedTx) {
        const txs: any[] = JSON.parse(storedTx);
        const exp = txs
          .filter((t) => {
            const d = new Date(t.date);
            return (
              d.getFullYear() === todayDateObj.getFullYear() &&
              d.getMonth() === todayDateObj.getMonth() &&
              d.getDate() === todayDateObj.getDate() &&
              t.type === 'expense'
            );
          })
          .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
        setTodayExpenses(exp);
      } else {
        setTodayExpenses(0);
      }

      // Habits
      const storedHabits = await AsyncStorage.getItem('@lenvry_habits');
      if (storedHabits) {
        const habits: any[] = JSON.parse(storedHabits);
        const todayHabits = habits.filter((h) => h.date === habitKey);
        setHabitTotalCount(todayHabits.length);
        setHabitCompletedCount(todayHabits.filter((h) => h.completed).length);
      } else {
        setHabitTotalCount(0);
        setHabitCompletedCount(0);
      }

      // Fitness
      const storedWorkouts = await AsyncStorage.getItem('@fitness_workouts');
      if (storedWorkouts) {
        const workouts: any[] = JSON.parse(storedWorkouts);
        const todayW = workouts.filter((w) => w.date === fitnessKey);
        setTodayWorkoutCount(todayW.length);
        if (todayW.length > 0) {
          setTodayWorkoutTitle(`${todayW.length} Exercises Done`);
          setTodayWorkoutSub(`${todayW[0].exercise} (${todayW[0].sets} Sets × ${todayW[0].reps})`);
        } else {
          setTodayWorkoutTitle('Rest Day');
          setTodayWorkoutSub('No workouts recorded');
        }
      } else {
        setTodayWorkoutCount(0);
        setTodayWorkoutTitle('Rest Day');
        setTodayWorkoutSub('No workouts recorded');
      }
    } catch (e) {
      console.error('Failed to sync dashboard metrics:', e);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: '#09090B' }]}>
      <StatusBar barStyle="light-content" backgroundColor="#09090B" translucent={true} />

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: TAB_BAR_HEIGHT + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <View style={styles.userProfile}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{userName.charAt(0).toUpperCase()}</Text>
            </View>
            <View>
              <Text style={styles.greetingText}>Hello, {userName}</Text>
              <Text style={styles.dateText}>{today}</Text>
            </View>
          </View>
        </View>

        <BentoGrid
          habitCompletedCount={habitCompletedCount}
          habitTotalCount={habitTotalCount}
          todayWorkoutTitle={todayWorkoutTitle}
          todayWorkoutSub={todayWorkoutSub}
          todayWorkoutCount={todayWorkoutCount}
          todayExpenses={todayExpenses}
        />

        <Text style={styles.sectionLabel}>QUICK ACTIONS</Text>
        <View style={styles.quickActionRow}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/finance' as Href)}
            activeOpacity={0.7}
          >
            <Ionicons name="add-circle" size={18} color="#38BDF8" />
            <Text style={styles.actionBtnText}>Add Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => router.push('/habits' as Href)}
            activeOpacity={0.7}
          >
            <Ionicons name="checkmark-circle" size={18} color="#8E97FD" />
            <Text style={styles.actionBtnText}>Check Habits</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.focusContainer}>
          <View style={styles.focusHeader}>
            <Ionicons name="flash" size={15} color="#FF453A" style={{ marginRight: 6 }} />
            <Text style={styles.focusHeaderText}>DAILY FOCUS</Text>
          </View>
          <Text style={styles.focusBodyText}>
            {todayExpenses === 0 && habitTotalCount === 0 && todayWorkoutCount === 0
              ? 'No activity registered for today yet. Start by checking off a habit, logging sets, or recording an expense.'
              : `Status: ${habitCompletedCount}/${habitTotalCount} habits checked, ${todayWorkoutCount} workout logs, and Rp ${todayExpenses.toLocaleString('id-ID')} spent.`}
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}