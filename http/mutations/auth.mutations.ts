import { useMutation } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AxiosError } from "axios";
import { toast } from "sonner";
import { api } from "@/http/api/api";
import { AUTH_QUERY_KEYS } from "@/queries/keys";
import { useUserStore } from "@/stores/user-store";
import { TRegister } from "@/schema/auth.schema";
import * as ToastText from "@/lib/toast-texts";
import { FAILURETOAST, STATUS_CODES } from "@/lib/constants/app.constants";
import useTokenStore from "@/store";
import { privateApi } from "../api/privateApi";

/**
 * Login Mutation - Send OTP to email
 */
export const useLoginMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationKey: [AUTH_QUERY_KEYS.LOGIN],
    mutationFn: async (email: string) => {
      const response = await api.post("/user/login", { email });
      return response.data;
    },
    onSuccess: (_, email) => {
      toast.success(ToastText.Login.success.title, {
        description: ToastText.Login.success.description,
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
        },
        duration: 3000,
      });

      // Navigate to verification page with email
      router.push(`/auth/verify/email?email=${encodeURIComponent(email)}`);
    },
    onError: (error: AxiosError<any>) => {
      const errorData = error.response?.data;
      const statusCode = error.response?.status;

      if (statusCode === 404 || errorData?.statusCode === 404) {
        toast.error(errorData?.message || "User not found", {
          description:
            "No account found with this email. Please sign up first.",
          style: {
            background: "#ef4444",
            color: "#fff",
            border: "none",
          },
          duration: 4000,
        });
        return;
      }

      // Generic error for other cases
      toast.error(errorData?.message || "Login failed", {
        description: errorData?.error || "Please try again later.",
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
        },
        duration: 4000,
      });
    },
  });
};
/**
 * Register Mutation - Create account and send OTP
 */
export const useRegisterMutation = () => {
  const router = useRouter();

  return useMutation({
    mutationKey: [AUTH_QUERY_KEYS.REGISTER],
    mutationFn: async (data: TRegister) => {
      const response = await api.post("/user", data);
      return {
        ...response.data,
        email: data.email,
      };
    },
    onSuccess: (data) => {
      toast.success(ToastText.Register.success.title, {
        description: ToastText.Register.success.description,
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
        },
        duration: 3000,
      });

      localStorage.setItem("verificationEmail", data.email);
      router.push(`/auth/verify?email=${encodeURIComponent(data.email)}`);
    },
    onError: (error: AxiosError<any>) => {
      const errorData = error.response?.data;

      if (error.response?.status === STATUS_CODES.CONFLICT) {
        toast.error(ToastText.Register.emailExists.title, {
          description:
            errorData?.message || ToastText.Register.emailExists.description,
          style: {
            background: "#ef4444",
            color: "#fff",
            border: "none",
          },
          duration: 4000,
        });
        return;
      }

      toast.error(ToastText.Register.error.title, {
        description: errorData?.message || ToastText.Register.error.description,
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
        },
        duration: 4000,
      });
    },
  });
};

/**
 * Verify Mutation - Verify OTP and get token with user role
 */
interface VerifyData {
  email: string;
  otp: string;
}

/**
 * Fetch Active User Function
 */
const fetchActiveUser = async (token: string) => {
  try {
    privateApi.defaults.headers.common["Authorization"] = `Bearer ${token}`;
    const response = await privateApi.get("/user/active");
    return response.data.data;
  } catch (error) {
    console.error("Error fetching active user:", error);
    throw error;
  }
};

export const useVerifyMutation = () => {
  const router = useRouter();
  const { setUser } = useUserStore();
  const { setToken } = useTokenStore();

  return useMutation({
    mutationKey: [AUTH_QUERY_KEYS.VERIFY],
    mutationFn: async (data: VerifyData) => {
      const response = await api.post("/user/login/verify", data);
      return response.data;
    },
    onSuccess: async (data) => {
      const { accessToken } = data.data || {};

      setToken(accessToken);

      const userData = await fetchActiveUser(accessToken);

      setUser(userData);

      toast.success(ToastText.Verify.success.title, {
        description: ToastText.Verify.success.description,
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
        },
        duration: 3000,
      });

      const role = userData?.role;
      if (role === "Admin") {
        router.push("/admin/dashboard");
      } else if (role === "User") {
        router.push("/user/dashboard");
      } else {
        router.push("/");
      }
    },
    onError: (error: AxiosError<any>) => {
      const errorData = error.response?.data;

      if (error.response?.status === STATUS_CODES.UNAUTHORIZED) {
        toast.error(ToastText.Verify.expired.title, {
          description:
            errorData?.message || ToastText.Verify.expired.description,
          style: {
            background: "#ef4444",
            color: "#fff",
            border: "none",
          },
          duration: 4000,
        });
        return;
      }

      toast.error(ToastText.Verify.invalid.title, {
        description: errorData?.message || ToastText.Verify.invalid.description,
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
        },
        duration: 4000,
      });
    },
  });
};

/**
 * Resend Verification Mutation
 */
export const useResendVerificationMutation = () => {
  return useMutation({
    mutationKey: [AUTH_QUERY_KEYS.RESEND],
    mutationFn: async (email: string) => {
      await api.post("/user/resend-verification", { email });
    },
    onSuccess: () => {
      toast.success(ToastText.Verify.resent.title, {
        description: ToastText.Verify.resent.description,
        style: {
          background: "#10b981",
          color: "#fff",
          border: "none",
        },
        duration: 3000,
      });
    },
    onError: (error: AxiosError<any>) => {
      const errorData = error.response?.data;
      toast.error("Failed to resend code", {
        description: errorData?.message || "Please try again",
        style: {
          background: "#ef4444",
          color: "#fff",
          border: "none",
        },
        duration: 4000,
      });
    },
  });
};

export const useVerifyEmailMutation = () => {
  const { setToken } = useTokenStore();

  return useMutation({
    mutationKey: [AUTH_QUERY_KEYS.VERIFY],
    mutationFn: async (token: string) => {
      const response = await api.post("/user/verify", { token });

      return response.data;
    },
    onSuccess: (data) => {
      if (data.accessToken) {
        setToken(data.accessToken);
      }
      toast.dismiss();
      toast.success("Otp verified successfully!", {
        description: "You can now access the features",
        duration: 3000,
        style: {
          background: "#4BB543",
          color: "#fff",
          border: "none",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
        },
      });
    },

    onError: (error: any) => {
      toast.dismiss();
      toast.error("Verification failed", {
        description:
          error.response?.data?.message ||
          "The link may be expired or invalid.",
        duration: 3000,
        style: {
          background: FAILURETOAST,
          color: "#fff",
          border: "none",
          fontSize: "14px",
          fontFamily: "Inter, sans-serif",
        },
      });
    },
  });
};
