import { create } from "zustand";
let toastTimer;
export const useUIStore = create((set) => ({
  modal: null,
  toast: "",
  sidebarOpen: false,
  theme: localStorage.getItem("music-theme") || "dark",
  setModal: (modal) => set({ modal }),
  setSidebar: (sidebarOpen) => set({ sidebarOpen }),
  notify: (toast) => {
    clearTimeout(toastTimer);
    set({ toast });
    toastTimer = setTimeout(() => set({ toast: "" }), 4200);
  },
  setTheme: (theme) => {
    localStorage.setItem("music-theme", theme);
    set({ theme });
  },
}));
