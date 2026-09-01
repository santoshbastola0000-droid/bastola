import { create } from "zustand";
import { persist } from "zustand/middleware";
import { UserRole, UserDetail } from "@/types/user.types";

interface UserState {
  user: UserDetail | null;
  isLoaded: boolean;

  // Actions
  setUser: (user: UserDetail | null) => void;
  updateUser: (updates: Partial<UserDetail>) => void;
  clearUser: () => void;
  setIsLoaded: (loaded: boolean) => void;
}

export const useUserStore = create<UserState>()(
  persist(
    (set) => ({
      user: null,
      isLoaded: false,

      setUser: (userData) => {
        set({
          user: userData,
          isLoaded: true,
        });

        if (
          typeof window !== "undefined" &&
          userData?.id &&
          userData?.email
        ) {
          try {
            const key = "roomkhoj_known_accounts";
            const stored = JSON.parse(
              localStorage.getItem(key) || "[]",
            ) as Array<{ id: string; name: string; email: string }>;
            const accounts = Array.isArray(stored) ? stored : [];
            const email = String(userData.email).toLowerCase();
            const nextAccounts = [
              {
                id: String(userData.id),
                name: String(userData.name || "RoomKhoj user"),
                email,
              },
              ...accounts.filter(
                (account) =>
                  account?.email?.toLowerCase() !== email,
              ),
            ].slice(0, 5);
            localStorage.setItem(key, JSON.stringify(nextAccounts));
          } catch {
            // Account history is optional.
          }
        }
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      clearUser: () => {
        // Clear Zustand state
        set({ user: null, isLoaded: true });

        // Clear localStorage
        if (typeof window !== "undefined") {
          localStorage.removeItem("user-storage");
        }
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
  const isUser = user?.role === UserRole.USER;

  return {
    isAdmin,
    isUser,
    user,
    setUser,
    updateUser,
    clearUser,
    isLoaded,
  };
};
