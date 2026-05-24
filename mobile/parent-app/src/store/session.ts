import AsyncStorage from "@react-native-async-storage/async-storage";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

import { setAuthToken } from "../lib/api";

type SessionState = {
  isAuthenticated: boolean;
  parentName: string;
  schoolSlug: string;
  token: string | null;
  selectedRouteId: number | null;
  login: (payload: { name: string; school_slug: string; token: string; routeId?: number }) => void;
  logout: () => void;
  setSelectedRoute: (routeId: number) => void;
  setName: (name: string) => void;
};

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      isAuthenticated: false,
      parentName: "",
      schoolSlug: "",
      token: null,
      selectedRouteId: null,

      login: (payload) => {
        setAuthToken(payload.token);
        set({
          isAuthenticated: true,
          parentName: payload.name,
          schoolSlug: payload.school_slug,
          token: payload.token,
          selectedRouteId: payload.routeId ?? null,
        });
      },

      logout: () => {
        setAuthToken(null);
        set({
          isAuthenticated: false,
          parentName: "",
          schoolSlug: "",
          token: null,
          selectedRouteId: null,
        });
      },

      setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),
      setName: (name) => set({ parentName: name }),
    }),
    {
      name: "skippo-parent-session",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist the data fields; actions are recreated by zustand on hydration
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        parentName: state.parentName,
        schoolSlug: state.schoolSlug,
        token: state.token,
        selectedRouteId: state.selectedRouteId,
      }),
      onRehydrateStorage: () => (state) => {
        // Re-apply the auth header after AsyncStorage rehydrates the token
        if (state?.token) {
          setAuthToken(state.token);
        }
      },
    },
  ),
);
