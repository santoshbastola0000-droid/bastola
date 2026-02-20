import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { TOKENS } from "@/lib/constants/app.constants";
import { useUserStore } from "@/stores/user-store";

export interface TokenStore {
  token: string;
  setToken: (data: string) => void;
  clearToken: () => void;
}

export const useTokenStore = create<TokenStore>()(
  devtools(
    persist(
      (set) => ({
        token: "",
        setToken: (data: string) => set(() => ({ token: data })),
        clearToken: () => {
          set(() => ({ token: "" }));
          useUserStore.getState().clearUser();
        },
      }),
      { name: TOKENS.AUTH_TOKEN_LABEL },
    ),
  ),
);

export default useTokenStore;
