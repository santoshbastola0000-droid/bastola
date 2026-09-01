"use client";

import { useEffect, useState } from "react";
import { FieldErrors, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  BriefcaseBusiness,
  CheckCircle2,
  Eye,
  EyeOff,
  Home,
  Megaphone,
  Search,
} from "lucide-react";

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
import SocialLoginButtons from "@/components/auth/SocialLoginButtons";

const purposes = [
  { value: "FIND_ROOM", title: "कोठा खोज्न", description: "आफ्नो बजेटअनुसार कोठा खोज्न", icon: Search },
  { value: "POST_ROOM", title: "कोठा पोस्ट गर्न", description: "कोठा वा फ्ल्याट listing राख्न", icon: Home },
  { value: "FIND_JOB", title: "जागिर खोज्न", description: "आफ्नो लागि job vacancy खोज्न", icon: BriefcaseBusiness },
  { value: "POST_JOB", title: "Vacancy पोस्ट गर्न", description: "कम्पनीको vacancy राख्न", icon: Megaphone },
] as const;

const fieldOrder: (keyof TRegister)[] = [
  "accountPurpose",
  "name",
  "email",
  "phoneNumber",
  "password",
  "confirmPassword",
];

const RegisterForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [referralCode, setReferralCode] = useState("");

  useEffect(() => {
    const code = new URLSearchParams(window.location.search).get("ref")?.trim().toUpperCase();
    if (code && /^RK[A-Z0-9]+$/.test(code)) {
      localStorage.setItem("roomkhoj_referral_code", code);
      setReferralCode(code);
      return;
    }
    setReferralCode(localStorage.getItem("roomkhoj_referral_code")?.trim().toUpperCase() || "");
  }, []);

  const form = useForm<TRegister>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phoneNumber: "",
      password: "",
      confirmPassword: "",
      accountPurpose: undefined,
    },
    shouldFocusError: false,
  });

  useEffect(() => {
    const email = new URLSearchParams(window.location.search).get("email")?.trim().toLowerCase();
    if (email) {
      form.setValue("email", email, { shouldValidate: true });
      localStorage.setItem("verificationEmail", email);
    }
  }, [form]);

  const { mutate: register, isPending } = useRegisterMutation();

  const handleInvalid = (errors: FieldErrors<TRegister>) => {
    const firstInvalidField = fieldOrder.find((field) => errors[field]);
    if (!firstInvalidField) return;

    if (firstInvalidField !== "accountPurpose") {
      form.setFocus(firstInvalidField);
    }

    requestAnimationFrame(() => {
      const element = document.querySelector<HTMLElement>(`[data-register-field="${firstInvalidField}"]`);
      element?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Create your RoomKhoj account</h2>
        <p className="mt-2 text-sm text-slate-600">केही जानकारी दिनुहोस्, हामी तपाईंलाई सही ठाउँबाट सुरु गराउँछौँ।</p>
      </div>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit((values) => {
            if (referralCode) sessionStorage.setItem("roomkhoj_signup_has_referral", "1");
            else sessionStorage.removeItem("roomkhoj_signup_has_referral");
            register({ ...values, referralCode: referralCode || undefined });
          }, handleInvalid)}
          className="space-y-4"
        >
          <div data-register-field="accountPurpose">
            <FormField control={form.control} name="accountPurpose" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-base font-semibold text-slate-800">तपाईं RoomKhoj केका लागि प्रयोग गर्दै हुनुहुन्छ?</FormLabel>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  {purposes.map((purpose) => {
                    const Icon = purpose.icon;
                    const selected = field.value === purpose.value;
                    return (
                      <button key={purpose.value} type="button" onClick={() => field.onChange(purpose.value)} className={`relative rounded-2xl border p-4 text-left transition-all ${selected ? "border-primary bg-primary/5 shadow-sm ring-1 ring-primary" : "border-slate-200 bg-white hover:border-primary/40 hover:bg-slate-50"}`}>
                        {selected && <CheckCircle2 className="absolute right-3 top-3 h-5 w-5 text-primary" />}
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${selected ? "bg-primary text-white" : "bg-slate-100 text-slate-600"}`}><Icon className="h-5 w-5" /></div>
                        <p className="mt-3 text-sm font-semibold text-slate-900">{purpose.title}</p>
                        <p className="mt-1 text-xs leading-5 text-slate-500">{purpose.description}</p>
                      </button>
                    );
                  })}
                </div>
                <FormMessage />
              </FormItem>
            )} />
          </div>

          <div data-register-field="name"><FormField control={form.control} name="name" render={({ field }) => <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input placeholder="Your full name" className="h-12 rounded-xl border-gray-200 px-4" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /></div>
          <div data-register-field="email"><FormField control={form.control} name="email" render={({ field }) => <FormItem><FormLabel>Email</FormLabel><FormControl><Input placeholder="you@example.com" type="email" className="h-12 rounded-xl border-gray-200 px-4" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /></div>
          <div data-register-field="phoneNumber"><FormField control={form.control} name="phoneNumber" render={({ field }) => <FormItem><FormLabel>Phone Number</FormLabel><FormControl><Input placeholder="+977 98XXXXXXXX" type="tel" className="h-12 rounded-xl border-gray-200 px-4" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /></div>
          <div data-register-field="password"><FormField control={form.control} name="password" render={({ field }) => <FormItem><FormLabel>Password</FormLabel><FormControl><div className="relative"><Input placeholder="At least 8 characters" type={showPassword ? "text" : "password"} className="h-12 rounded-xl border-gray-200 px-4 pr-12" {...field} disabled={isPending} /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-3 top-3 text-slate-400 hover:text-slate-700" aria-label={showPassword ? "Hide password" : "Show password"}>{showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}</button></div></FormControl><FormMessage /></FormItem>} /></div>
          <div data-register-field="confirmPassword"><FormField control={form.control} name="confirmPassword" render={({ field }) => <FormItem><FormLabel>Confirm Password</FormLabel><FormControl><Input placeholder="Repeat your password" type={showPassword ? "text" : "password"} className="h-12 rounded-xl border-gray-200 px-4" {...field} disabled={isPending} /></FormControl><FormMessage /></FormItem>} /></div>

          <Button type="submit" className="h-12 w-full rounded-xl text-base font-medium" disabled={isPending} isLoading={isPending}>Create Account</Button>
        </form>
      </Form>

      <div className="relative py-1">
        <div className="border-t border-slate-200" />
        <span className="absolute left-1/2 top-1 -translate-x-1/2 -translate-y-1/2 bg-white px-3 text-xs text-slate-400">
          or sign up with
        </span>
      </div>

      <SocialLoginButtons />

      <p className="text-center text-sm text-slate-600">Already have an account?{" "}<Link href={routes.LOGIN} className="font-medium text-primary hover:underline">Sign in</Link></p>
    </div>
  );
};

export default RegisterForm;
