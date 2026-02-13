import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole, SingleUserDetail } from "@/types/user.types";

interface UserState {
  user: SingleUserDetail | null;
  isLoaded: boolean;

  // Actions
  setUser: (user: SingleUserDetail | null) => void;
  updateUser: (updates: Partial<SingleUserDetail>) => void;
  clearUser: () => void;
  setIsLoaded: (loaded: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoaded: false,

      setUser: (userData) =>
        set({
          user: userData,
          isLoaded: true,
        }),

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearUser: () => {
        // Clear both Zustand state and localStorage
        set({ user: null, isLoaded: true });
        // Force clear localStorage
        localStorage.removeItem("user-storage");
      },

      setIsLoaded: (isLoaded) => set({ isLoaded }),
    }),
    {
      name: "user-storage",
      version: 1,
    },
  ),
);

// Enhanced hook for user role checks
export const useUserRole = () => {
  const user = useUserStore((state) => state.user);
  const setUser = useUserStore((state) => state.setUser);
  const updateUser = useUserStore((state) => state.updateUser);
  const clearUser = useUserStore((state) => state.clearUser);
  const isLoaded = useUserStore((state) => state.isLoaded);

  const isAdmin = user?.role === UserRole.ADMIN;
  const isOrganization = user?.role === UserRole.ORGANIZATION;
  const isUser = user?.role === UserRole.USER;

  return {
    isAdmin,
    isOrganization,
    isUser,
    user,
    setUser,
    updateUser,
    clearUser,
    isLoaded,
  };
};
