import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { FontAwesome5, Ionicons } from '@expo/vector-icons';
import { Account, ACCOUNT_TYPE_THEME, getAccountIcon, hexToRgba } from '../../../types/finance';
import { COLORS, RADIUS } from '../../../constants/theme';

interface FormAccountSelectorProps {
  label: string;
  accounts: Account[];
  selectedAccId: string;
  selectedSubAccId: string;
  onSelectAccount: (acc: Account) => void;
  onSelectSubAccount: (subId: string) => void;
}

export const FormAccountSelector = ({
  label,
  accounts,
  selectedAccId,
  selectedSubAccId,
  onSelectAccount,
  onSelectSubAccount,
}: FormAccountSelectorProps) => {
  const selectedAccount = accounts.find((a) => a.id === selectedAccId);

  return (
    <View style={styles.container}>
      <Text style={styles.sectionTitle}>{label.toUpperCase()}</Text>

      {/* Main Accounts Grid */}
      <View style={styles.accountGrid}>
        {accounts.map((acc) => {
          const isSelected = acc.id === selectedAccId;
          const theme = ACCOUNT_TYPE_THEME[acc.type] || ACCOUNT_TYPE_THEME.Bank;
          const iconName = getAccountIcon(acc.type);

          return (
            <TouchableOpacity
              key={acc.id}
              style={[
                styles.accountCard,
                {
                  backgroundColor: isSelected ? theme.color : hexToRgba(theme.color, 0.18),
                  borderColor: isSelected ? theme.color : hexToRgba(theme.color, 0.4),
                },
              ]}
              onPress={() => onSelectAccount(acc)}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.accountIconWrap,
                  { backgroundColor: isSelected ? '#08090C' : theme.color },
                ]}
              >
                <FontAwesome5
                  name={iconName}
                  size={14}
                  color={isSelected ? theme.color : '#08090C'}
                />
              </View>
              <View style={styles.accountTextCol}>
                <Text
                  style={[
                    styles.accountName,
                    { color: isSelected ? '#08090C' : COLORS.textPrimary },
                  ]}
                  numberOfLines={1}
                >
                  {acc.name}
                </Text>
                <Text
                  style={[
                    styles.accountMeta,
                    { color: isSelected ? '#1E293B' : theme.color },
                  ]}
                  numberOfLines={1}
                >
                  {acc.type} • {acc.currency || 'IDR'}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Sub-Accounts / Pockets */}
      {selectedAccount && selectedAccount.subAccounts && selectedAccount.subAccounts.length > 0 && (
        <View style={styles.subAccountsContainer}>
          <View style={styles.subHeaderRow}>
            <Ionicons name="folder-open-outline" size={14} color={COLORS.finance} />
            <Text style={styles.subAccountTitle}>POCKETS / SUB-ACCOUNTS</Text>
          </View>
          <View style={styles.subAccountGrid}>
            {selectedAccount.subAccounts.map((sub) => {
              const isSubSelected = sub.id === selectedSubAccId;

              return (
                <TouchableOpacity
                  key={sub.id}
                  style={[
                    styles.subPocketCard,
                    isSubSelected
                      ? styles.subPocketCardSelected
                      : styles.subPocketCardUnselected,
                  ]}
                  onPress={() => onSelectSubAccount(sub.id)}
                  activeOpacity={0.75}
                >
                  <Ionicons
                    name={isSubSelected ? 'checkmark-circle' : 'wallet-outline'}
                    size={16}
                    color={isSubSelected ? '#08090C' : '#818CF8'}
                  />
                  <Text
                    style={[
                      styles.subPocketText,
                      isSubSelected
                        ? styles.subPocketTextSelected
                        : styles.subPocketTextUnselected,
                    ]}
                    numberOfLines={1}
                  >
                    {sub.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: COLORS.textMuted,
    letterSpacing: 0.8,
    marginBottom: 10,
  },
  accountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  accountCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
  },
  accountIconWrap: {
    width: 32,
    height: 32,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  accountTextCol: {
    flex: 1,
  },
  accountName: {
    fontSize: 13,
    fontWeight: '800',
  },
  accountMeta: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  subAccountsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: COLORS.bgCardSub,
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderSubtle,
  },
  subHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  subAccountTitle: {
    fontSize: 11,
    color: COLORS.finance,
    fontWeight: '700',
    letterSpacing: 0.6,
  },
  subAccountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  subPocketCard: {
    width: '48.5%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
  },
  subPocketCardUnselected: {
    backgroundColor: hexToRgba('#818CF8', 0.12),
    borderColor: hexToRgba('#818CF8', 0.3),
  },
  subPocketCardSelected: {
    backgroundColor: '#818CF8',
    borderColor: '#818CF8',
  },
  subPocketText: {
    flex: 1,
    fontSize: 12.5,
  },
  subPocketTextUnselected: {
    color: COLORS.textPrimary,
    fontWeight: '600',
  },
  subPocketTextSelected: {
    color: '#08090C',
    fontWeight: '800',
  },
});
