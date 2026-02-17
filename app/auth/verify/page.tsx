import { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";

import VerifyOTPForm from "@/components/auth/VerifyOTPForm";

export const metadata: Metadata = {
  title: "Verify Email | RoomHub",
  description: "Verify your email address",
};

const VerifyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-white to-primary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-block">
            <h1 className="text-3xl font-bold text-primary">RoomHub</h1>
          </Link>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <Suspense fallback={<div>Loading...</div>}>
            <VerifyOTPForm />
          </Suspense>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-500 mt-8">
          © 2024 RoomHub. All rights reserved.
        </p>
      </div>
    </div>
  );
};

export default VerifyPage;
