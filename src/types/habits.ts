export interface Habit {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  date: string;
}

export interface ConfirmConfig {
  visible: boolean;
  title: string;
  message: string;
  isDestructive: boolean;
  confirmText: string;
  onConfirm: () => void;
}