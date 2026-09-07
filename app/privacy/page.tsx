import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy Policy | RoomKhoj",
  description: "How RoomKhoj collects, uses and protects information when you use our services.",
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-slate-950">Privacy Policy</h1>
        <p className="mt-2 text-sm text-slate-500">Last updated: September 7, 2026</p>

        <div className="mt-8 space-y-7 leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. Information we collect</h2>
            <p className="mt-2">Depending on the features you use, RoomKhoj may collect account details such as your name, email address and phone number; profile and listing information; messages and transaction records; device and security information; and information you choose to provide when contacting us.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">2. Location information</h2>
            <p className="mt-2">Location is collected only when a feature needs it and permission is provided. Room discovery may use location to show nearby results. Authorized field-staff features may collect work-session location while tracking is visibly active. We do not intend to track staff location outside an active work session.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">3. How we use information</h2>
            <p className="mt-2">We use information to operate RoomKhoj, provide listings and search, enable communication, secure accounts, process requested transactions, support users, improve our services, prevent abuse and comply with legal obligations.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">4. Social platform integrations</h2>
            <p className="mt-2">When an authorized administrator connects a social account such as TikTok, RoomKhoj may receive authorization tokens and account information needed for the requested integration. Tokens are intended to be stored on the server and used only to provide authorized functionality such as publishing approved RoomKhoj content. You can disconnect an integrated account through the available controls.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">5. Sharing of information</h2>
            <p className="mt-2">We may share information with service providers where necessary to operate features such as hosting, authentication, communications, maps, payments and social integrations. We may also disclose information when required by law, to protect users or to prevent fraud and abuse. We do not make private account information public merely because it is stored by RoomKhoj.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">6. Data security</h2>
            <p className="mt-2">We use reasonable technical and organizational safeguards designed to protect information, including access controls and server-side handling of sensitive integration credentials. No online service can guarantee absolute security.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">7. Data choices and retention</h2>
            <p className="mt-2">You can choose whether to grant browser permissions such as location and can disconnect supported integrations. We retain information for as long as reasonably necessary to provide the service, maintain security and records, resolve disputes and meet legal obligations, subject to applicable requirements.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">8. Children</h2>
            <p className="mt-2">RoomKhoj is not intended to knowingly collect personal information from children where doing so would violate applicable law. If you believe inappropriate information has been provided, contact us so it can be reviewed.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">9. Policy updates</h2>
            <p className="mt-2">We may update this policy as RoomKhoj changes. The latest version will be published on this page with its updated date.</p>
          </section>
          <section>
            <h2 className="text-xl font-semibold">10. Contact</h2>
            <p className="mt-2">For privacy questions or requests, use the contact options available on RoomKhoj at www.roomkhoj.com.</p>
          </section>
        </div>
      </article>
    </main>
  );
}
