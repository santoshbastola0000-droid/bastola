import { Badge } from "@/components/ui/badge";
import { UserRole } from "@/types/user.types";
import { User, Shield, CheckCircle, Clock, ChevronDown } from "lucide-react";

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

/**
 * Admin verification summary.
 *
 * Email verification is backed by the existing account isVerified flag.
 * The current User model does not have a separate phone-verification flag,
 * so phone verification is intentionally shown as Pending rather than
 * incorrectly treating a verified email as a verified phone number.
 */
export const getVerificationBadge = (isVerified: boolean) => {
  const statusClass = (verified: boolean) =>
    verified
      ? "border-emerald-200 bg-emerald-50 text-emerald-700"
      : "border-amber-200 bg-amber-50 text-amber-700";

  const StatusIcon = (verified: boolean) =>
    verified ? CheckCircle : Clock;

  const EmailIcon = StatusIcon(isVerified);
  const PhoneIcon = StatusIcon(false);

  return (
    <details className="group relative min-w-[112px]">
      <summary className="list-none cursor-pointer [&::-webkit-details-marker]:hidden">
        <Badge
          variant="outline"
          className={`${statusClass(isVerified)} gap-1.5 whitespace-nowrap`}
        >
          <EmailIcon className="h-3 w-3" />
          {isVerified ? "Verified" : "Pending"}
          <ChevronDown className="h-3 w-3 transition-transform group-open:rotate-180" />
        </Badge>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-56 rounded-lg border bg-white p-2 shadow-lg">
        <div className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wide text-slate-500">
          Verification
        </div>
        <div className="space-y-1">
          <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <EmailIcon className="h-3.5 w-3.5" />
              Email
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${statusClass(isVerified)}`}>
              {isVerified ? "Verified" : "Pending"}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3 rounded-md px-2 py-1.5 text-xs">
            <span className="flex items-center gap-1.5 text-slate-700">
              <PhoneIcon className="h-3.5 w-3.5" />
              Phone number
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-medium ${statusClass(false)}`}>
              Pending
            </span>
          </div>
        </div>
      </div>
    </details>
  );
};

export const getRoleOptions = () => [
  { value: "all", label: "All Roles" },
  { value: UserRole.ADMIN, label: "Admin" },
  { value: UserRole.USER, label: "User" },
];
