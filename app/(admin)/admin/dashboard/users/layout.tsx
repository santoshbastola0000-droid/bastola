import Link from "next/link";
import { History } from "lucide-react";

export default function UsersLayout({ children }: { children: React.ReactNode }) {
  return (
    <div>
      <div className="px-4 pt-4 md:px-6 md:pt-6">
        <Link
          href="/admin/dashboard/users/visits"
          className="inline-flex items-center gap-2 rounded-lg border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
        >
          <History className="h-4 w-4" />
          User Visit History
        </Link>
      </div>
      {children}
    </div>
  );
}
