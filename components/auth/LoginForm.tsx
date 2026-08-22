"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff, LockKeyhole, Mail } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TLogin, loginSchema } from "@/schema/auth.schema";
import {
  useLoginMutation,
  usePasswordLoginMutation,
} from "@/http/mutations/auth.mutations";
import { routes } from "@/lib/constants/routes";

interface LoginFormProps {
  onSuccess?: () => void;
}

type LoginMode = "otp" | "password";

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const [mode, setMode] = useState<LoginMode>("otp");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<TLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "" },
  });

  const { mutate: login, isPending: isOtpPending } = useLoginMutation();
  const { mutate: passwordLogin, isPending: isPasswordPending } =
    usePasswordLoginMutation();

  const onOtpSubmit = (values: TLogin) => {
    login(values.email, { onSuccess });
  };

  const onPasswordSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    passwordLogin(
      { identifier, password },
      { onSuccess },
    );
  };

  const isPending = isOtpPending || isPasswordPending;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome to RoomKhoj</h2>
        <p className="mt-2 text-sm text-gray-600">
          आफ्नो account मा सुरक्षित रूपमा sign in गर्नुहोस्
        </p>
      </div>

      <div className="grid grid-cols-2 rounded-xl bg-slate-100 p-1">
        <button
          type="button"
          onClick={() => setMode("otp")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "otp"
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Email OTP
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
            mode === "password"
              ? "bg-white text-primary shadow-sm"
              : "text-slate-500 hover:text-slate-800"
          }`}
        >
          Password
        </button>
      </div>

      {mode === "otp" ? (
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onOtpSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input
                      placeholder="Enter your email"
                      type="email"
                      className="h-12 rounded-xl border-gray-200 px-4 focus:ring-2 focus:ring-primary/20"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="h-12 w-full rounded-xl text-base font-medium"
              disabled={isPending}
              isLoading={isOtpPending}
            >
              <Mail className="h-4 w-4" />
              Send OTP
            </Button>
          </form>
        </Form>
      ) : (
        <form onSubmit={onPasswordSubmit} className="space-y-4">
          <Input
            value={identifier}
            onChange={(event) => setIdentifier(event.target.value)}
            placeholder="Email or phone number"
            autoComplete="username"
            className="h-12 rounded-xl border-gray-200 px-4 focus:ring-2 focus:ring-primary/20"
            disabled={isPending}
            required
          />

          <div className="relative">
            <Input
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              className="h-12 rounded-xl border-gray-200 px-4 pr-12 focus:ring-2 focus:ring-primary/20"
              disabled={isPending}
              minLength={8}
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
            </button>
          </div>

          <Button
            type="submit"
            className="h-12 w-full rounded-xl text-base font-medium"
            disabled={isPending}
            isLoading={isPasswordPending}
          >
            <LockKeyhole className="h-4 w-4" />
            Sign in with password
          </Button>
        </form>
      )}

      <div className="relative py-1">
        <div className="border-t border-slate-200" />
        <span className="absolute left-1/2 top-1 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-slate-400">
          or continue with
        </span>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Button type="button" variant="outline" className="h-11 rounded-xl" disabled>
          Google (soon)
        </Button>
        <Button type="button" variant="outline" className="h-11 rounded-xl" disabled>
          Facebook (soon)
        </Button>
      </div>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don&apos;t have an account?{" "}
          <Link
            href={routes.REGISTER}
            className="font-medium text-primary hover:text-primary-dark"
          >
            Create Account
          </Link>
        </p>
      </div>

      <p className="text-center text-xs text-gray-500">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-primary">Terms</Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">Privacy Policy</Link>.
      </p>
    </div>
  );
};
export default LoginForm;
