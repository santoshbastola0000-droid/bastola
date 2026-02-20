import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/user.types";
import { User, Shield, CheckCircle, Clock } from "lucide-react";

export const getRoleBadge = (role: UserRole) => {
  const variants = {
    [UserRole.ADMIN]: {
      variant: "default" as const,
      icon: Shield,
      className: "bg-purple-100 text-purple-800 hover:bg-purple-100",
    },
    [UserRole.USER]: {
      variant: "secondary" as const,
      icon: User,
      className: "bg-green-100 text-green-800 hover:bg-green-100",
    },
  };

  const config = variants[role];
  const Icon = config.icon;

  return (
    <Badge variant={config.variant} className={`${config.className} border-0`}>
      <Icon className="h-3 w-3 mr-1" />
      {role}
    </Badge>
  );
};

export const getVerificationBadge = (isVerified: boolean) => {
  return isVerified ? (
    <Badge
      variant="outline"
      className="bg-emerald-50 text-emerald-700 border-emerald-200"
    >
      <CheckCircle className="h-3 w-3 mr-1" />
      Verified
    </Badge>
  ) : (
    <Badge
      variant="outline"
      className="bg-amber-50 text-amber-700 border-amber-200"
    >
      <Clock className="h-3 w-3 mr-1" />
      Pending
    </Badge>
  );
};

export const getRoleOptions = () => [
  { value: "all", label: "All Roles" },
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.USER, label: "User" },
];
