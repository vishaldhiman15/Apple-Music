import { create } from "zustand";
import { api, backendEnabled } from "../lib/api";
export const useAuthStore = create((set) => ({
  currentUser: null,
  checking: true,
  backendAvailable: false,
  fetchProfile: async () => {
    if (!backendEnabled) {
      set({ checking: false });
      return;
    }
    try {
      const health = await api("/health", { timeout: 1800 });
      set({ backendAvailable: health.database === "connected" });
      if (health.database === "connected") {
        try {
          const user = await api("/auth/me");
          set({ currentUser: user });
        } catch {}
      }
    } catch {
    } finally {
      set({ checking: false });
    }
  },
  login: async (email, password) => {
    try {
      const user = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      set({ currentUser: user, backendAvailable: true });
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },
  register: async (name, email, password) => {
    try {
      const user = await api("/auth/register", {
        method: "POST",
        body: { name, email, password },
      });
      set({ currentUser: user, backendAvailable: true });
      return { success: true };
    } catch (e) {
      return { success: false, message: e.message };
    }
  },
  logout: async () => {
    await api("/auth/logout", { method: "POST" });
    set({ currentUser: null });
  },
  updateProfile: async (data) => {
    const user = await api("/auth/me", { method: "PATCH", body: data });
    set({ currentUser: user });
    return user;
  },
}));
