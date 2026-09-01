"use client";

import { Button } from "@/components/ui/button";

type Provider = "google" | "facebook";

interface SocialLoginButtonsProps {
  className?: string;
}

const SocialLoginButtons = ({ className = "" }: SocialLoginButtonsProps) => {
  const startLogin = (provider: Provider) => {
    const backendUrl = (
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com"
    ).replace(/\/$/, "");

    window.location.assign(`${backendUrl}/user/oauth/${provider}`);
  };

  return (
    <div className={`grid grid-cols-2 gap-3 ${className}`}>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-xl font-medium"
        onClick={() => startLogin("google")}
      >
        <span className="mr-2 text-base font-bold">G</span>
        Google
      </Button>
      <Button
        type="button"
        variant="outline"
        className="h-11 rounded-xl font-medium"
        onClick={() => startLogin("facebook")}
      >
        <span className="mr-2 text-base font-bold text-blue-600">f</span>
        Facebook
      </Button>
    </div>
  );
};

export default SocialLoginButtons;
