"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { TRegister, registerSchema } from "@/schema/auth.schema";
import { useRegisterMutation } from "@/http/mutations/auth.mutations";
import { routes } from "@/lib/constants/routes";

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<TRegister>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { mutate: register, isPending } = useRegisterMutation();

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">Create an account</h2>
        <p className="mt-2 text-sm text-gray-600">
          Join RoomKhoj to find your perfect rental space
        </p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit((values) => register(values))} className="space-y-4">
          {[
            ["name", "Full Name", "John Doe", "text"],
            ["email", "Email", "john@example.com", "email"],
            ["phoneNumber", "Phone Number", "+977-9817323233", "tel"],
          ].map(([name, label, placeholder, type]) => (
            <FormField
              key={name}
              control={form.control}
              name={name as "name" | "email" | "phoneNumber"}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{label}</FormLabel>
                  <FormControl>
                    <Input
                      placeholder={placeholder}
                      type={type}
                      className="h-12 rounded-xl border-gray-200 px-4"
                      {...field}
                      disabled={isPending}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          ))}

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="At least 8 characters"
                      type={showPassword ? "text" : "password"}
                      className="h-12 rounded-xl border-gray-200 px-4 pr-12"
                      {...field}
                      disabled={isPending}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-3 top-3 text-slate-400 hover:text-slate-700"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Repeat your password"
                    type={showPassword ? "text" : "password"}
                    className="h-12 rounded-xl border-gray-200 px-4"
                    {...field}
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="h-12 w-full rounded-xl text-base font-medium" disabled={isPending} isLoading={isPending}>
            Create Account
          </Button>
        </form>
      </Form>

      <div className="text-center">
        <p className="text-sm text-gray-600">
          Already have an account?{" "}
          <Link href={routes.LOGIN} className="font-medium text-primary hover:text-primary-dark">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
