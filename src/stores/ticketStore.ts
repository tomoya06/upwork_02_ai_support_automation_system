import { create } from "zustand";

interface TicketFilters {
  status?: string;
  category?: string;
  priority?: string;
}

interface TicketStore {
  filters: TicketFilters;
  setFilters: (filters: TicketFilters) => void;
  resetFilters: () => void;
}

export const useTicketStore = create<TicketStore>((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  resetFilters: () => set({ filters: {} }),
}));
