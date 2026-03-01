"use client";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserDetail, UserRole } from "@/types/user.types";

interface UserAvatarProps {
  user: UserDetail;
  className?: string;
}

export function UserAvatar({ user, className = "" }: UserAvatarProps) {
  const getInitials = () => {
    if (user.name) {
      return user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return user.email?.slice(0, 2).toUpperCase() || "U";
  };

  const getRoleColor = () => {
    switch (user.role) {
      case UserRole.ADMIN:
        return "bg-purple-100 text-purple-700";
      case UserRole.USER:
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Avatar className={`${className} ${getRoleColor()}`}>
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  );
}
