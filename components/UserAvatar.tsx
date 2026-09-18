"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { UserDetail, UserRole } from "@/types/user.types";

interface UserAvatarProps {
  user: UserDetail;
  className?: string;
}

export function UserAvatar({ user, className = "" }: UserAvatarProps) {
  const backendUrl = String(process.env.NEXT_PUBLIC_BACKEND_URL || "https://api.roomkhoj.com").replace(/\/$/, "");
  const rawPhoto = String(user.profilePhotoUrl || "").trim();
  const photoUrl = !rawPhoto
    ? ""
    : /^https?:\/\//i.test(rawPhoto)
      ? rawPhoto
      : `${backendUrl}${rawPhoto.startsWith("/") ? rawPhoto : `/${rawPhoto}`}`;
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
      {photoUrl ? <AvatarImage src={photoUrl} alt={user.name || "Profile"} className="object-cover" /> : null}
      <AvatarFallback>{getInitials()}</AvatarFallback>
    </Avatar>
  );
}
