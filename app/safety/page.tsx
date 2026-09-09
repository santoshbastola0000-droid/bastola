import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Safety Tips | RoomKhoj",
  description:
    "Practical safety tips for finding rooms, jobs and communicating through RoomKhoj.",
};

export default function SafetyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-slate-950">Safety Tips</h1>
        <p className="mt-2 text-sm text-slate-500">
          Use these checks before paying, visiting a property or accepting a job.
        </p>

        <div className="mt-8 space-y-7 leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. Verify before you pay</h2>
            <p className="mt-2">
              Do not send money only because someone creates urgency. Confirm the room, owner or employer details, understand what the payment is for, and use RoomKhoj payment features when they are available for that transaction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Inspect rooms safely</h2>
            <p className="mt-2">
              Check the property and important conditions such as rent, deposit, utilities, facilities and move-in terms before committing. For a first visit, consider going during daytime and letting someone you trust know where you are going.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Protect personal information</h2>
            <p className="mt-2">
              Share only the information needed for the transaction. Never send passwords, OTP codes, banking PINs or other account-security secrets through chat or phone calls.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Be careful with job offers</h2>
            <p className="mt-2">
              Verify the company or employer, job location, duties, salary and working conditions. Be cautious when a job offer asks for unusual advance payments, sensitive documents without a clear reason, or promises unrealistic income.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Keep important communication clear</h2>
            <p className="mt-2">
              Use written messages for important terms where practical, keep receipts or payment records, and review the listing or job details before confirming an agreement.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Report suspicious activity</h2>
            <p className="mt-2">
              If a listing, job, message or payment request looks suspicious, stop the transaction and contact RoomKhoj support with the relevant details so it can be reviewed.
            </p>
          </section>
        </div>

        <div className="mt-10 rounded-xl bg-slate-100 p-5">
          <p className="font-medium text-slate-950">Need help?</p>
          <p className="mt-1 text-sm text-slate-600">
            Use the RoomKhoj contact page if you need support or want to report a concern.
          </p>
          <Link
            href="/contact"
            className="mt-3 inline-flex font-semibold text-primary hover:underline"
          >
            Contact RoomKhoj
          </Link>
        </div>
      </article>
    </main>
  );
}
