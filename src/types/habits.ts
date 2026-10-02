export type PriorityLevel = 'low' | 'medium' | 'high';
export type FrequencyType = 'once' | 'daily' | 'weekdays' | 'custom_days';
export type TimeSlot = 'Anytime' | 'Morning' | 'Afternoon' | 'Evening';

export interface SubTask {
  id: string;
  title: string;
  completed: boolean;
}

export interface Habit {
  id: string;
  title: string;
  category: string;
  completed: boolean;
  date: string;
  description?: string;
  priority?: PriorityLevel;
  timeSlot?: TimeSlot;
  reminderTime?: string;
  reminderSound?: string;
  notificationId?: string;
  frequency?: FrequencyType;
  repeatDays?: number[]; // 0=Sun, 1=Mon, 2=Tue, 3=Wed, 4=Thu, 5=Fri, 6=Sat
  completedDates?: string[];
  subtasks?: SubTask[];
  extraNotes?: string[]; // additional descriptions added from the detail modal
}