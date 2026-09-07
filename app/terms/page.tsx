import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Terms of Service | RoomKhoj",
  description: "Terms governing the use of RoomKhoj room, job, messaging and related services.",
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-slate-950">Terms of Service</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 7, 2026</p>

        <div className="mt-8 space-y-7 leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. About RoomKhoj</h2>
            <p className="mt-2">RoomKhoj is an online platform that helps people discover and publish room, flat, house and job information and communicate with other users. RoomKhoj may also provide messaging, account, wallet, referral, staff and social-publishing features.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">2. Your account</h2>
            <p className="mt-2">You must provide accurate information, keep your account secure and use RoomKhoj only for lawful purposes. You are responsible for activity performed through your account unless prohibited by applicable law.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">3. Listings and user content</h2>
            <p className="mt-2">You are responsible for listings, photos, descriptions, messages and other content you submit. Do not post false, misleading, unlawful, infringing or harmful content. RoomKhoj may review, restrict or remove content that violates these terms or platform rules.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">4. Payments and paid features</h2>
            <p className="mt-2">Some RoomKhoj features may require payment or use wallet, escrow, subscription or monetization functionality. Prices and applicable conditions are shown before the relevant transaction. Users should verify transaction details before confirming a payment or release.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">5. Third-party services</h2>
            <p className="mt-2">RoomKhoj may integrate services provided by third parties, including authentication, maps, payment, email and social platforms such as TikTok. Your use of those services may also be governed by their own terms and policies.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">6. Safety and prohibited use</h2>
            <p className="mt-2">Do not misuse RoomKhoj to commit fraud, impersonate others, scrape protected information, bypass access controls, distribute malicious content, harass users or violate another person&apos;s rights or applicable law.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">7. Availability and responsibility</h2>
            <p className="mt-2">RoomKhoj provides a platform for connecting users and does not guarantee that every listing, job, user statement or third-party service will always be accurate, available or suitable. Users should independently verify important information before making commitments.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">8. Changes and termination</h2>
            <p className="mt-2">We may update features and these terms as the service evolves. Accounts or access may be restricted where reasonably necessary to protect users, comply with law or enforce these terms.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">9. Contact</h2>
            <p className="mt-2">For questions about these terms, use the contact options available on RoomKhoj at www.roomkhoj.com.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
