import { Metadata } from "next";
import Link from "next/link";

import RegisterForm from "@/components/auth/RegisterForm";

export const metadata: Metadata = {
  title: "Sign Up | RoomHub",
  description: "Create your RoomHub account",
};

const RegisterPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <RegisterForm />
        </div>

        <p className="text-center text-xs text-gray-500 mt-8">
          © 2026 RentalServise. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default RegisterPage;
