import React from 'react';
import { UnifiedAccountModal } from './UnifiedAccountModal';
import { Account } from '../../types/finance';

interface ManageAccountsModalProps {
  visible: boolean;
  accounts: Account[];
  getAccBalance: (accId: string) => number;
  onClose: () => void;
  onReorderAccounts: (newAccounts: Account[]) => void;
}

export const ManageAccountsModal = ({
  visible,
  accounts,
  getAccBalance,
  onClose,
  onReorderAccounts,
}: ManageAccountsModalProps) => {
  return (
    <UnifiedAccountModal
      visible={visible}
      accounts={accounts}
      mode="manage"
      accFormType="main"
      newAccName=""
      newAccType="Bank"
      newAccCurrency="IDR"
      parentAccId=""
      getAccBalance={getAccBalance}
      onClose={onClose}
      onSaveAccount={() => {}}
      onReorderAccounts={onReorderAccounts}
      setAccFormType={() => {}}
      setNewAccName={() => {}}
      setNewAccType={() => {}}
      setNewAccCurrency={() => {}}
      setParentAccId={() => {}}
    />
  );
};
