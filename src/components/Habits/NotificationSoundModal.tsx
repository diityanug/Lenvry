import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  TouchableWithoutFeedback,
  ScrollView,
  Switch,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, RADIUS } from '../../constants/theme';
import {
  SOUND_OPTIONS,
  SoundOption,
  playSoundPreview,
  stopSoundPreview,
  getActivePreviewId,
  getNotificationSettings,
  saveNotificationSettings,
  triggerTestNotification,
  NotificationSettings,
} from '../../services/habitNotificationService';

interface NotificationSoundModalProps {
  visible: boolean;
  selectedSoundId: string;
  onSelectSound: (soundId: string) => void;
  onClose: () => void;
}

export default function NotificationSoundModal({
  visible,
  ...props
}: NotificationSoundModalProps) {
  if (!visible) return null;

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={props.onClose}
    >
      <NotificationSoundContent {...props} />
    </Modal>
  );
}

function NotificationSoundContent({
  selectedSoundId,
  onSelectSound,
  onClose,
}: Omit<NotificationSoundModalProps, 'visible'>) {
  const [playingId, setPlayingId] = useState<string | null>(getActivePreviewId);
  const [settings, setSettings] = useState<NotificationSettings>({
    enabled: true,
    defaultSound: selectedSoundId || 'chime',
    vibrate: true,
    fullScreenAlarm: true,
  });
  const [testSent, setTestSent] = useState(false);
  const [isSendingTest, setIsSendingTest] = useState(false);

  useEffect(() => {
    let isMounted = true;
    getNotificationSettings().then((s) => {
      if (isMounted) setSettings(s);
    });

    return () => {
      isMounted = false;
      stopSoundPreview();
    };
  }, []);

  const handleToggleSound = async (soundId: string) => {
    if (playingId === soundId) {
      stopSoundPreview();
      setPlayingId(null);
    } else {
      setPlayingId(soundId);
      const played = await playSoundPreview(soundId, () => {
        setPlayingId(null);
      });
      if (!played) {
        setPlayingId(null);
      }
    }
  };

  const handleSelect = (sound: SoundOption) => {
    onSelectSound(sound.id);
    saveNotificationSettings({ defaultSound: sound.id });
    setSettings((prev) => ({ ...prev, defaultSound: sound.id }));
  };

  const handleToggleSetting = async (key: keyof NotificationSettings, value: boolean) => {
    const updated = await saveNotificationSettings({ [key]: value });
    setSettings(updated);
  };

  const handleSendTest = async () => {
    if (isSendingTest) return;
    setIsSendingTest(true);
    setTestSent(false);

    const success = await triggerTestNotification(selectedSoundId || settings.defaultSound);
    setIsSendingTest(false);
    if (success) {
      setTestSent(true);
      setTimeout(() => setTestSent(false), 4000);
    }
  };

  const handleDone = () => {
    stopSoundPreview();
    onClose();
  };

  return (
    <TouchableWithoutFeedback onPress={handleDone}>
      <View style={styles.overlay}>
          <TouchableWithoutFeedback onPress={() => {}}>
            <View style={styles.container}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerTitleWrap}>
                  <View style={styles.iconCircle}>
                    <Ionicons name="musical-notes" size={18} color={COLORS.success} />
                  </View>
                  <View>
                    <Text style={styles.headerTitle}>Sound & Notification Style</Text>
                    <Text style={styles.headerSubtitle}>Choose ringtones & configure habit alarms</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeBtn}
                  onPress={handleDone}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={18} color={COLORS.textPrimary} />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} style={{ maxHeight: 420 }}>
                {/* Sound Options List */}
                <Text style={styles.sectionLabel}>RINGTONE OPTIONS</Text>
                <View style={styles.soundList}>
                  {SOUND_OPTIONS.map((s) => {
                    const isSelected = (selectedSoundId || settings.defaultSound) === s.id;
                    const isPlaying = playingId === s.id;

                    return (
                      <TouchableOpacity
                        key={s.id}
                        style={[
                          styles.soundCard,
                          isSelected && styles.soundCardSelected,
                        ]}
                        onPress={() => handleSelect(s)}
                        activeOpacity={0.75}
                      >
                        {/* Radio Checkmark */}
                        <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                          {isSelected && <View style={styles.radioInner} />}
                        </View>

                        {/* Title & Description */}
                        <View style={styles.soundInfo}>
                          <View style={styles.soundTitleRow}>
                            <Text style={[styles.soundName, isSelected && styles.soundNameActive]}>
                              {s.name}
                            </Text>
                            {isSelected && (
                              <View style={styles.activeTag}>
                                <Text style={styles.activeTagText}>Selected</Text>
                              </View>
                            )}
                          </View>
                          <Text style={styles.soundSubtitle}>{s.subtitle}</Text>
                        </View>

                        {/* Play / Preview Button */}
                        <TouchableOpacity
                          style={[
                            styles.previewBtn,
                            isPlaying && styles.previewBtnActive,
                          ]}
                          onPress={(e) => {
                            e.stopPropagation();
                            handleToggleSound(s.id);
                          }}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                          activeOpacity={0.7}
                        >
                          <Ionicons
                            name={isPlaying ? 'pause' : 'volume-high-outline'}
                            size={16}
                            color={isPlaying ? '#08090C' : COLORS.textPrimary}
                          />
                        </TouchableOpacity>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Additional Alert Preferences */}
                <Text style={[styles.sectionLabel, { marginTop: 16 }]}>ALARM & SCREEN SETTINGS</Text>
                <View style={styles.settingsCard}>
                  {/* Full Screen Alarm Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingTitleRow}>
                        <Ionicons name="expand-outline" size={15} color={COLORS.success} />
                        <Text style={styles.settingTitle}>Full Screen Alarm Pop-up</Text>
                      </View>
                      <Text style={styles.settingDesc}>
                        Display interactive full screen alarm when habit time arrives
                      </Text>
                    </View>
                    <Switch
                      value={settings.fullScreenAlarm}
                      onValueChange={(val) => handleToggleSetting('fullScreenAlarm', val)}
                      trackColor={{ false: COLORS.border, true: COLORS.success }}
                      thumbColor="#FFFFFF"
                    />
                  </View>

                  <View style={styles.divider} />

                  {/* Vibrate Toggle */}
                  <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                      <View style={styles.settingTitleRow}>
                        <Ionicons name="pulse-outline" size={15} color={COLORS.warning} />
                        <Text style={styles.settingTitle}>Device Vibration</Text>
                      </View>
                      <Text style={styles.settingDesc}>
                        Enable vibration when reminder rings
                      </Text>
                    </View>
                    <Switch
                      value={settings.vibrate}
                      onValueChange={(val) => handleToggleSetting('vibrate', val)}
                      trackColor={{ false: COLORS.border, true: COLORS.success }}
                      thumbColor="#FFFFFF"
                    />
                  </View>
                </View>

                {/* Test Notification Action */}
                <View style={styles.testSection}>
                  <TouchableOpacity
                    style={[styles.testBtn, testSent && styles.testBtnSuccess]}
                    onPress={handleSendTest}
                    activeOpacity={0.8}
                    disabled={isSendingTest}
                  >
                    {isSendingTest ? (
                      <ActivityIndicator size="small" color="#08090C" style={{ marginRight: 6 }} />
                    ) : (
                      <Ionicons
                        name={testSent ? 'checkmark-circle' : 'notifications-circle'}
                        size={18}
                        color={testSent ? '#08090C' : COLORS.textPrimary}
                        style={{ marginRight: 6 }}
                      />
                    )}
                    <Text style={[styles.testBtnText, testSent && styles.testBtnTextSuccess]}>
                      {testSent ? 'Notification Sent (Check Status Bar)' : 'Test Device Notification (3 Sec)'}
                    </Text>
                  </TouchableOpacity>
                  <Text style={styles.testHint}>
                    Schedules a test notification banner in 3 seconds to test sound on your device.
                  </Text>
                </View>
              </ScrollView>

              {/* Confirm / Done Button */}
              <TouchableOpacity
                style={styles.doneBtn}
                onPress={handleDone}
                activeOpacity={0.85}
              >
                <Text style={styles.doneBtnText}>SAVE SETTINGS</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: COLORS.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  container: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 18,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    elevation: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.45,
    shadowRadius: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    marginBottom: 14,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: COLORS.successSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  headerSubtitle: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: '500',
    marginTop: 1,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.bgCardSub,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  sectionLabel: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginBottom: 8,
    textTransform: 'uppercase',
  },
  soundList: {
    gap: 8,
  },
  soundCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  soundCardSelected: {
    borderColor: COLORS.success,
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
  },
  radioCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  radioCircleActive: {
    borderColor: COLORS.success,
  },
  radioInner: {
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: COLORS.success,
  },
  soundInfo: {
    flex: 1,
  },
  soundTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  soundName: {
    color: COLORS.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  soundNameActive: {
    color: COLORS.success,
  },
  activeTag: {
    backgroundColor: COLORS.successSoft,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
  },
  activeTagText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
  },
  soundSubtitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 1,
  },
  previewBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.bgCard,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  previewBtnActive: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  settingsCard: {
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    padding: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  settingInfo: {
    flex: 1,
    marginRight: 12,
  },
  settingTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  settingTitle: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  settingDesc: {
    color: COLORS.textMuted,
    fontSize: 10,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.border,
    marginVertical: 10,
  },
  testSection: {
    marginTop: 14,
    marginBottom: 4,
  },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.md,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  testBtnSuccess: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  testBtnText: {
    color: COLORS.textPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  testBtnTextSuccess: {
    color: '#08090C',
    fontWeight: '800',
  },
  testHint: {
    color: COLORS.textMuted,
    fontSize: 10,
    textAlign: 'center',
    marginTop: 6,
  },
  doneBtn: {
    backgroundColor: COLORS.success,
    borderRadius: RADIUS.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  doneBtnText: {
    color: '#08090C',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});
