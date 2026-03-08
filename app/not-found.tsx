"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Home, ArrowLeft, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center">
        {/* Animated Icon */}
        <div className="relative mb-8">
          <div className="absolute inset-0 animate-ping opacity-20">
            <AlertCircle className="h-32 w-32 text-primary mx-auto" />
          </div>
          <AlertCircle className="h-32 w-32 text-primary mx-auto relative" />
        </div>

        {/* Error Code */}
        <h1 className="text-8xl font-bold text-primary mb-4">404</h1>

        {/* Title */}
        <h2 className="text-2xl md:text-3xl font-semibold text-gray-900 mb-3">
          Page Not Found
        </h2>

        {/* Description */}
        <p className="text-gray-600 mb-8">
          Oops! The page you're looking for doesn't exist or has been moved.
          Let's get you back on track.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            onClick={() => router.back()}
            variant="outline"
            className="cursor-pointer gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>

          <Link href="/">
            <Button className="bg-primary hover:bg-primary-dark cursor-pointer gap-2 w-full sm:w-auto">
              <Home className="h-4 w-4" />
              Return Home
            </Button>
          </Link>
        </div>

        {/* Help Text */}
        <p className="mt-8 text-sm text-gray-500">
          Need assistance?{" "}
          <Link href="/contact" className="text-primary hover:underline">
            Contact Support
          </Link>
        </p>
      </div>
    </div>
  );
}
