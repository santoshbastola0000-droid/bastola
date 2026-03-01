import useTokenStore from "@/store";
import { useUserStore } from "@/stores/user-store";
import { useRouter } from "next/navigation";

export const useLogout = () => {
  const router = useRouter();
  const { clearToken } = useTokenStore();
  const { clearUser } = useUserStore();

  const logout = async () => {
    clearToken();
    clearUser();

    localStorage.removeItem("user-storage");
    localStorage.removeItem("auth-token");

    router.push("/");
    router.refresh(); // Force a refresh to update server components
  };

  return { logout };
};
