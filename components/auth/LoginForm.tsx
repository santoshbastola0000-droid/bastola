"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";

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
import { useLoginMutation } from "@/http/mutations/auth.mutations";
import { routes } from "@/lib/constants/routes";

interface LoginFormProps {
  onSuccess?: () => void;
}

const LoginForm = ({ onSuccess }: LoginFormProps) => {
  const form = useForm<TLogin>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
    },
  });

  const { mutate: login, isPending } = useLoginMutation();

  const onSubmit = (values: TLogin) => {
    login(values.email, {
      onSuccess: onSuccess,
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Welcome back</h2>
        <p className="mt-2 text-sm text-gray-600">
          Enter your email to receive a verification code
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input
                    placeholder="Enter your email"
                    type="email"
                    className="h-12 px-4 border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20"
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
            className="w-full h-12 text-base font-medium bg-primary hover:bg-primary-dark rounded-xl transition-all duration-200 cursor-pointer"
            disabled={isPending}
            isLoading={isPending}
          >
            Send OTP
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Don't have an account?{" "}
          <Link
            href={routes.REGISTER}
            className="font-medium text-primary hover:text-primary-dark transition-colors"
          >
            Sign up
          </Link>
        </p>
      </div>

      <p className="text-xs text-center text-gray-500">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-primary">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-primary">
          Privacy Policy
        </Link>
      </p>
    </div>
  );
};

export default LoginForm;
