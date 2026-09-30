import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  playSoundPreview,
  stopSoundPreview,
  SOUND_OPTIONS,
} from '../../services/habitNotificationService';

export interface HabitAlarmData {
  habitId: string;
  habitTitle: string;
  habitCategory?: string;
  reminderTime?: string;
  soundId?: string;
  [key: string]: unknown;
}

interface HabitAlarmModalProps {
  visible: boolean;
  data: HabitAlarmData | null;
  onComplete: (habitId: string) => void;
  onSnooze: (habitId: string) => void;
  onDismiss: () => void;
}

function HabitAlarmContent({
  data,
  onComplete,
  onSnooze,
  onDismiss,
}: {
  data: HabitAlarmData;
  onComplete: (habitId: string) => void;
  onSnooze: (habitId: string) => void;
  onDismiss: () => void;
}) {
  const [isMuted, setIsMuted] = useState(false);
  const [pulseAnim] = useState(() => new Animated.Value(1));
  const [rippleAnim] = useState(() => new Animated.Value(0));

  // Sound playback & pulsing loop
  useEffect(() => {
    const soundId = data.soundId || 'chime';
    playSoundPreview(soundId);

    const loopInterval = setInterval(() => {
      if (!isMuted) {
        playSoundPreview(soundId);
      }
    }, 4000);

    const pulseAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnimation.start();

    const rippleAnimation = Animated.loop(
      Animated.timing(rippleAnim, {
        toValue: 1,
        duration: 1800,
        useNativeDriver: true,
      })
    );
    rippleAnimation.start();

    return () => {
      clearInterval(loopInterval);
      pulseAnimation.stop();
      rippleAnimation.stop();
      stopSoundPreview();
    };
  }, [data.soundId, isMuted, pulseAnim, rippleAnim]);

  const handleToggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (data?.soundId) {
        playSoundPreview(data.soundId);
      }
    } else {
      setIsMuted(true);
      stopSoundPreview();
    }
  };

  const handleActionComplete = () => {
    stopSoundPreview();
    if (data.habitId) {
      onComplete(data.habitId);
    }
  };

  const handleActionSnooze = () => {
    stopSoundPreview();
    if (data.habitId) {
      onSnooze(data.habitId);
    }
  };

  const handleActionDismiss = () => {
    stopSoundPreview();
    onDismiss();
  };

  const currentSoundObj = SOUND_OPTIONS.find((s) => s.id === data.soundId) || SOUND_OPTIONS[0];

  const rippleScale = rippleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [1, 2.2],
  });

  const rippleOpacity = rippleAnim.interpolate({
    inputRange: [0, 0.7, 1],
    outputRange: [0.6, 0.2, 0],
  });

  return (
    <View style={styles.container}>
      {/* Top Bar with Mute & Dismiss */}
      <View style={styles.topBar}>
        <View style={styles.badgeWrap}>
          <View style={styles.liveIndicator} />
          <Text style={styles.badgeText}>ACTIVE REMINDER</Text>
        </View>

        <TouchableOpacity
          style={styles.muteBtn}
          onPress={handleToggleMute}
          activeOpacity={0.7}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={20}
            color={isMuted ? COLORS.danger : COLORS.success}
          />
        </TouchableOpacity>
      </View>

      {/* Center Content: Animated Alarm Ripple & Digital Time */}
      <View style={styles.centerSection}>
        {/* Animated Pulsing Rings */}
        <View style={styles.bellWrapper}>
          <Animated.View
            style={[
              styles.rippleRing,
              {
                transform: [{ scale: rippleScale }],
                opacity: rippleOpacity,
              },
            ]}
          />
          <Animated.View
            style={[
              styles.bellCircle,
              {
                transform: [{ scale: pulseAnim }],
              },
            ]}
          >
            <Ionicons name="alarm" size={54} color="#08090C" />
          </Animated.View>
        </View>

        {/* Time Display */}
        <Text style={styles.timeDisplay}>{data.reminderTime || 'Now'}</Text>
        <Text style={styles.timeSubtext}>Time to complete your habit activity</Text>

        {/* Habit Details Card */}
        <View style={styles.card}>
          {data.habitCategory && (
            <View style={styles.categoryPill}>
              <Ionicons name="pricetag-outline" size={12} color={COLORS.success} />
              <Text style={styles.categoryText}>{data.habitCategory}</Text>
            </View>
          )}

          <Text style={styles.habitTitle}>{data.habitTitle}</Text>

          <View style={styles.soundIndicatorRow}>
            <Ionicons name="musical-notes-outline" size={13} color={COLORS.textMuted} />
            <Text style={styles.soundIndicatorText}>
              Ringtone: {currentSoundObj.name} {isMuted ? '(Muted)' : ''}
            </Text>
          </View>
        </View>
      </View>

      {/* Bottom Actions */}
      <View style={styles.actionsSection}>
        {/* Mark Complete - Primary Accent */}
        <TouchableOpacity
          style={styles.completeBtn}
          onPress={handleActionComplete}
          activeOpacity={0.85}
        >
          <Ionicons name="checkmark-done" size={20} color="#08090C" style={{ marginRight: 8 }} />
          <Text style={styles.completeBtnText}>MARK COMPLETE NOW</Text>
        </TouchableOpacity>

        {/* Row of Secondary Actions: Snooze & Dismiss */}
        <View style={styles.secondaryRow}>
          <TouchableOpacity
            style={styles.snoozeBtn}
            onPress={handleActionSnooze}
            activeOpacity={0.75}
          >
            <Ionicons name="time-outline" size={16} color={COLORS.warning} style={{ marginRight: 6 }} />
            <Text style={styles.snoozeBtnText}>Snooze 5 Min</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissBtn}
            onPress={handleActionDismiss}
            activeOpacity={0.75}
          >
            <Ionicons name="close" size={16} color={COLORS.textMuted} style={{ marginRight: 6 }} />
            <Text style={styles.dismissBtnText}>Dismiss Alarm</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

export default function HabitAlarmModal({
  visible,
  data,
  onComplete,
  onSnooze,
  onDismiss,
}: HabitAlarmModalProps) {
  if (!visible || !data) return null;

  return (
    <Modal animationType="fade" transparent={false} visible={visible} onRequestClose={onDismiss}>
      <HabitAlarmContent
        data={data}
        onComplete={onComplete}
        onSnooze={onSnooze}
        onDismiss={onDismiss}
      />
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bgCanvas,
    paddingHorizontal: 24,
    paddingTop: 54,
    paddingBottom: 40,
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  badgeWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  liveIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.success,
    marginRight: 8,
  },
  badgeText: {
    color: COLORS.success,
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1,
  },
  muteBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerSection: {
    alignItems: 'center',
    marginVertical: 'auto',
  },
  bellWrapper: {
    width: 140,
    height: 140,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  rippleRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(16, 185, 129, 0.25)',
  },
  bellCircle: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: COLORS.success,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 16,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.55,
    shadowRadius: 20,
  },
  timeDisplay: {
    color: COLORS.textPrimary,
    fontSize: 42,
    fontWeight: '900',
    letterSpacing: -1,
  },
  timeSubtext: {
    color: COLORS.textMuted,
    fontSize: 13,
    fontWeight: '500',
    marginTop: 4,
    marginBottom: 26,
    textAlign: 'center',
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
  },
  categoryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: RADIUS.xs,
    marginBottom: 10,
    gap: 5,
  },
  categoryText: {
    color: COLORS.success,
    fontSize: 11,
    fontWeight: '700',
  },
  habitTitle: {
    color: COLORS.textPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: -0.3,
  },
  soundIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  soundIndicatorText: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  actionsSection: {
    gap: 12,
  },
  completeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.lg,
    paddingVertical: 16,
    elevation: 8,
    shadowColor: COLORS.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
  },
  completeBtnText: {
    color: '#08090C',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  secondaryRow: {
    flexDirection: 'row',
    gap: 10,
  },
  snoozeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: 'rgba(234, 179, 8, 0.3)',
  },
  snoozeBtnText: {
    color: COLORS.warning,
    fontSize: 12,
    fontWeight: '700',
  },
  dismissBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dismissBtnText: {
    color: COLORS.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
});
