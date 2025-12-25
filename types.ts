
export type AppMode = 'personal' | 'shared';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly';

export interface Task {
  id: string;
  title: string;
  completed: boolean;
  isShared: boolean;
  familyId?: string; // 家族を識別するためのID
  type: 'todo' | 'reminder';
  dueDate?: string; 
  recurrence?: {
    type: RecurrenceType;
    dayOfWeek?: number;
    dayOfMonth?: number;
  };
  snoozeCount: number;
  createdAt: string;
}

export interface Memo {
  id: string;
  title: string;
  content: string;
  isShared: boolean;
  familyId?: string; // 家族を識別するためのID
  updatedAt: string;
}

export type PaymentMethod = 'bank_transfer' | 'direct_payment';

export interface Transaction {
  id: string;
  item: string;
  amount: number;
  bankName: string;
  method: PaymentMethod;
  isShared: boolean;
  date: string;
}

export interface BankSummary {
  bankName: string;
  totalAmount: number;
  transactionCount: number;
}
