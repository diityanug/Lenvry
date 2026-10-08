import React from 'react';
import { UnifiedAccountModal } from './UnifiedAccountModal';
import { Account } from '../../types/finance';

interface AddAccountModalProps {
  visible: boolean;
  accFormType: 'main' | 'sub';
  newAccName: string;
  newAccDesc?: string;
  newAccType: Account['type'];
  newAccCurrency: 'IDR' | 'USD';
  parentAccId: string;
  accounts: Account[];
  onClose: () => void;
  onSave: () => void;
  setAccFormType: (type: 'main' | 'sub') => void;
  setNewAccName: (val: string) => void;
  setNewAccDesc?: (val: string) => void;
  setNewAccType: (t: Account['type']) => void;
  setNewAccCurrency: (c: 'IDR' | 'USD') => void;
  setParentAccId: (id: string) => void;
}

export const AddAccountModal = (props: AddAccountModalProps) => {
  return (
    <UnifiedAccountModal
      {...props}
      mode="add"
      onSaveAccount={props.onSave}
    />
  );
};
