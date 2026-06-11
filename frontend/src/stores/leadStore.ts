import { create } from 'zustand';
import type { Lead, PaginatedResponse } from '@/types';
import { get, post, put, del } from '@/lib/api';

interface LeadFilters {
  search?: string;
  status?: string;
  source?: string;
  assigned_to?: number;
  page?: number;
}

interface Pagination {
  count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
}

interface LeadState {
  leads: Lead[];
  selectedLead: Lead | null;
  isLoading: boolean;
  filters: LeadFilters;
  pagination: Pagination;
}

interface LeadActions {
  fetchLeads: (filters?: LeadFilters) => Promise<void>;
  createLead: (data: Partial<Lead>) => Promise<Lead>;
  updateLead: (id: number, data: Partial<Lead>) => Promise<Lead>;
  deleteLead: (id: number) => Promise<void>;
  setSelectedLead: (lead: Lead | null) => void;
}

export const useLeadStore = create<LeadState & LeadActions>((set, get) => ({
  leads: [],
  selectedLead: null,
  isLoading: false,
  filters: { page: 1 },
  pagination: {
    count: 0,
    total_pages: 0,
    current_page: 1,
    page_size: 20,
  },

  fetchLeads: async (filters?: LeadFilters) => {
    set({ isLoading: true });
    try {
      const params = { ...get().filters, ...filters };
      set({ filters: params });
      const { data } = await get<PaginatedResponse<Lead>>('/leads/', params as Record<string, unknown>);
      set({
        leads: data.results,
        pagination: data.pagination,
        isLoading: false,
      });
    } catch {
      set({ isLoading: false });
    }
  },

  createLead: async (leadData) => {
    const { data } = await post<{ data: Lead }>('/leads/', leadData);
    const newLead = data.data;
    set((state) => ({ leads: [newLead, ...state.leads] }));
    return newLead;
  },

  updateLead: async (id, leadData) => {
    const { data } = await put<{ data: Lead }>(`/leads/${id}/`, leadData);
    const updated = data.data;
    set((state) => ({
      leads: state.leads.map((l) => (l.id === id ? updated : l)),
      selectedLead: state.selectedLead?.id === id ? updated : state.selectedLead,
    }));
    return updated;
  },

  deleteLead: async (id) => {
    await del(`/leads/${id}/`);
    set((state) => ({
      leads: state.leads.filter((l) => l.id !== id),
      selectedLead: state.selectedLead?.id === id ? null : state.selectedLead,
    }));
  },

  setSelectedLead: (lead) => set({ selectedLead: lead }),
}));
