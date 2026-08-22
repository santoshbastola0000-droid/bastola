import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";
import { useRouter } from "next/navigation";

const MANUAL_LOGOUT_KEY = "roomkhoj_manual_logout_at";

export const useLogout = () => {
  const router = useRouter();
  const { clearToken } = useTokenStore();
  const { clearUser } = useUserStore();

  const logout = async () => {
    sessionStorage.setItem(MANUAL_LOGOUT_KEY, String(Date.now()));
    clearToken();
    clearUser();

    localStorage.removeItem("user-storage");
    localStorage.removeItem("auth-token");

    router.push("/");
    router.refresh(); // Force a refresh to update server components
  };

  return { logout };
};
