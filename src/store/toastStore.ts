import { create } from 'zustand';

export type ToastVariant = 'success' | 'error' | 'warning' | 'info';

export interface ToastItem {
  id: string;
  variant: ToastVariant;
  title?: string;
  message: string;
  durationMs: number;
}

interface ToastState {
  current: ToastItem | null;
  queue: ToastItem[];
  show: (item: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => void;
  dismiss: (id?: string) => void;
}

let toastCounter = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  current: null,
  queue: [],

  show: ({ variant, title, message, durationMs }) => {
    const cleanMessage = message?.trim();
    if (!cleanMessage) return;

    const item: ToastItem = {
      id: `toast-${++toastCounter}`,
      variant,
      title,
      message: cleanMessage,
      durationMs: durationMs ?? (variant === 'error' ? 4200 : 3000),
    };

    const { current, queue } = get();
    if (!current) {
      set({ current: item });
    } else if (current.message === item.message && current.variant === item.variant) {
      // Refresh same active toast instead of stacking duplicates
      set({ current: item });
    } else {
      set({ queue: [...queue, item] });
    }
  },

  dismiss: (id) => {
    const { current, queue } = get();
    if (id && current && current.id !== id) {
      set({ queue: queue.filter((t) => t.id !== id) });
      return;
    }

    if (queue.length > 0) {
      const [next, ...rest] = queue;
      set({ current: next, queue: rest });
    } else {
      set({ current: null });
    }
  },
}));

/** Convenience imperative API usable from screens, stores, and services */
export const toast = {
  success: (message: string, title = 'Success') =>
    useToastStore.getState().show({ variant: 'success', title, message }),
  error: (message: string, title = 'Something went wrong') =>
    useToastStore.getState().show({ variant: 'error', title, message }),
  warning: (message: string, title = 'Heads up') =>
    useToastStore.getState().show({ variant: 'warning', title, message }),
  info: (message: string, title?: string) =>
    useToastStore.getState().show({ variant: 'info', title, message }),
  dismiss: (id?: string) => useToastStore.getState().dismiss(id),
};

