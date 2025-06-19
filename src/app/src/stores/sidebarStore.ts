import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SidebarState {
  isExpanded: boolean;
  isMobile: boolean;
  isOverlayOpen: boolean;
  toggleExpanded: () => void;
  setMobile: (isMobile: boolean) => void;
  openOverlay: () => void;
  closeOverlay: () => void;
  setExpanded: (expanded: boolean) => void;
}

export const useSidebarStore = create<SidebarState>()(
  persist(
    (set, get) => ({
      isExpanded: false,
      isMobile: false,
      isOverlayOpen: false,
      
      toggleExpanded: () => {
        const { isMobile } = get();
        if (isMobile) {
          set((state) => ({ isOverlayOpen: !state.isOverlayOpen }));
        } else {
          set((state) => ({ isExpanded: !state.isExpanded }));
        }
      },
      
      setMobile: (isMobile: boolean) => {
        set({ isMobile });
        if (isMobile) {
          set({ isExpanded: false, isOverlayOpen: false });
        }
      },
      
      openOverlay: () => set({ isOverlayOpen: true }),
      closeOverlay: () => set({ isOverlayOpen: false }),
      setExpanded: (expanded: boolean) => set({ isExpanded: expanded }),
    }),
    {
      name: 'sidebar-store',
      partialize: (state) => ({ isExpanded: state.isExpanded }),
    }
  )
);