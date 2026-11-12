import { create } from 'zustand';

interface SyncState {
  syncTick: number;
  bumpSync: () => void;
}

/**
 * Lightweight event counter incremented on any successful CRUD mutation or
 * Supabase Realtime change so focused screens refresh seamlessly.
 */
export const useSyncStore = create<SyncState>((set) => ({
  syncTick: 0,
  bumpSync: () => set((state) => ({ syncTick: state.syncTick + 1 })),
}));

