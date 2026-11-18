import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { COLORS, RADIUS } from '../../constants/theme';
import { hapticMedium, hapticSuccess, hapticWarning } from '../../utils/haptics';

interface WaterTrackerCardProps {
  amountMl: number;
  targetMl: number;
  onAddWater: (amount: number) => void;
  onResetWater: () => void;
}

export const WaterTrackerCard = ({
  amountMl,
  targetMl,
  onAddWater,
  onResetWater,
}: WaterTrackerCardProps) => {
  const handleAdd = (added: number) => {
    if (amountMl + added >= targetMl && amountMl < targetMl) {
      hapticSuccess();
    } else {
      hapticMedium();
    }
    onAddWater(added);
  };

  const handleReset = () => {
    hapticWarning();
    onResetWater();
  };
  const percent = Math.min(100, Math.round((amountMl / Math.max(1, targetMl)) * 100));
  const glasses = Math.round(amountMl / 250);
  const targetGlasses = Math.max(1, Math.round(targetMl / 250));
  const remainingMl = Math.max(0, targetMl - amountMl);
  const isGoalReached = amountMl >= targetMl;

  // Render 8 visual indicator dots/glasses (represents target distribution)
  const totalPills = 8;
  const filledPills = Math.min(totalPills, Math.round((amountMl / Math.max(1, targetMl)) * totalPills));

  return (
    <View style={waterStyles.card}>
      {/* Header section with icon, title, and current percentage tag */}
      <View style={waterStyles.headerRow}>
        <View style={waterStyles.titleGroup}>
          <View style={waterStyles.iconWrapper}>
            <Ionicons name="water" size={18} color="#0284C7" />
          </View>
          <View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={waterStyles.title}>Water Intake</Text>
            </View>
            <Text style={waterStyles.subtitle}>
              {isGoalReached
                ? 'Great job! Daily hydration achieved'
                : `${remainingMl.toLocaleString('en-US')} ml left to reach goal`}
            </Text>
          </View>
        </View>

        <View style={waterStyles.badgePercent}>
          <Text style={waterStyles.badgePercentText}>{percent}%</Text>
        </View>
      </View>

      {/* Main Stats Row: Huge Current vs Target, and Glass count */}
      <View style={waterStyles.statsCard}>
        <View style={waterStyles.statsMain}>
          <View style={waterStyles.numbersRow}>
            <Text style={waterStyles.bigAmount}>{amountMl.toLocaleString('en-US')}</Text>
            <Text style={waterStyles.targetLabel}>/ {targetMl.toLocaleString('en-US')} ml</Text>
          </View>
          <Text style={waterStyles.glassCount}>
            {glasses} of {targetGlasses} glasses (~250ml each)
          </Text>
        </View>

        <TouchableOpacity
          style={waterStyles.resetIconBtn}
          onPress={handleReset}
          activeOpacity={0.65}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="refresh-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      {/* Visual Glass Segmented Tracker */}
      <View style={waterStyles.segmentsRow}>
        {Array.from({ length: totalPills }).map((_, index) => {
          const isFilled = index < filledPills;
          return (
            <View
              key={index}
              style={[
                waterStyles.segmentPill,
                isFilled ? waterStyles.segmentPillFilled : waterStyles.segmentPillEmpty,
              ]}
            >
              {isFilled && <View style={waterStyles.segmentGlow} />}
            </View>
          );
        })}
      </View>

      {/* Action Buttons Row */}
      <View style={waterStyles.actionsRow}>
        <TouchableOpacity
          style={waterStyles.quickBtn}
          onPress={() => handleAdd(250)}
          activeOpacity={0.8}
        >
          <View style={waterStyles.btnIconBg}>
            <Ionicons name="add" size={13} color="#0284C7" />
          </View>
          <View style={waterStyles.btnTextCol}>
            <Text style={waterStyles.quickBtnTitle} numberOfLines={1} adjustsFontSizeToFit>250 ml</Text>
            <Text style={waterStyles.quickBtnSub}>Glass</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={waterStyles.quickBtn}
          onPress={() => handleAdd(500)}
          activeOpacity={0.8}
        >
          <View style={waterStyles.btnIconBg}>
            <Ionicons name="add" size={13} color="#0284C7" />
          </View>
          <View style={waterStyles.btnTextCol}>
            <Text style={waterStyles.quickBtnTitle} numberOfLines={1} adjustsFontSizeToFit>500 ml</Text>
            <Text style={waterStyles.quickBtnSub}>Bottle</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={waterStyles.quickBtn}
          onPress={() => handleAdd(100)}
          activeOpacity={0.8}
        >
          <View style={waterStyles.btnIconBg}>
            <Ionicons name="add" size={13} color="#0284C7" />
          </View>
          <View style={waterStyles.btnTextCol}>
            <Text style={waterStyles.quickBtnTitle} numberOfLines={1} adjustsFontSizeToFit>100 ml</Text>
            <Text style={waterStyles.quickBtnSub}>Sip</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const waterStyles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.bgCard,
    borderRadius: RADIUS.xl,
    padding: 18,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.16)',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  iconWrapper: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(2, 132, 199, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.28)',
  },
  title: {
    fontSize: 15,
    fontWeight: '800',
    color: COLORS.textPrimary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 11,
    color: COLORS.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  goalReachedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  goalReachedText: {
    color: COLORS.success,
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  badgePercent: {
    backgroundColor: 'rgba(2, 132, 199, 0.14)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.3)',
  },
  badgePercentText: {
    color: '#0284C7',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  statsCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsMain: {
    flex: 1,
  },
  numbersRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 5,
  },
  bigAmount: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0284C7',
    letterSpacing: -0.5,
  },
  targetLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textMuted,
  },
  glassCount: {
    fontSize: 11,
    color: COLORS.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  resetIconBtn: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.bgCardSub,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentsRow: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 14,
  },
  segmentPill: {
    flex: 1,
    height: 7,
    borderRadius: 4,
    overflow: 'hidden',
  },
  segmentPillFilled: {
    backgroundColor: '#0284C7',
  },
  segmentPillEmpty: {
    backgroundColor: COLORS.bgCardSub,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  segmentGlow: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  quickBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.bgCardSub,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(2, 132, 199, 0.22)',
    gap: 6,
  },
  btnIconBg: {
    width: 20,
    height: 20,
    borderRadius: 6,
    backgroundColor: 'rgba(2, 132, 199, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnTextCol: {
    flex: 1,
  },
  quickBtnTitle: {
    fontSize: 11.5,
    fontWeight: '800',
    color: COLORS.textPrimary,
  },
  quickBtnSub: {
    fontSize: 10,
    color: COLORS.textMuted,
    marginTop: 1,
  },
});

