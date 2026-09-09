import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Cookie Policy | RoomKhoj",
  description:
    "How RoomKhoj uses cookies and similar browser storage technologies.",
};

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-10 text-slate-800">
      <article className="mx-auto max-w-4xl rounded-2xl bg-white p-6 shadow-sm sm:p-10">
        <h1 className="text-3xl font-bold text-slate-950">Cookie Policy</h1>
        <p className="mt-2 text-sm text-slate-500">
          Last updated: September 9, 2026
        </p>

        <div className="mt-8 space-y-7 leading-7">
          <section>
            <h2 className="text-xl font-semibold">1. What this policy covers</h2>
            <p className="mt-2">
              RoomKhoj may use cookies, local storage, session storage and similar browser technologies to keep the website working, remember selected settings, protect sessions and improve the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">2. Essential storage</h2>
            <p className="mt-2">
              Some browser storage may be necessary for sign-in, security, session continuity, navigation and other features you request. Disabling essential storage can prevent parts of RoomKhoj from working correctly.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">3. Preferences</h2>
            <p className="mt-2">
              RoomKhoj may remember choices such as interface preferences or temporary feature state so you do not have to set them again on every page visit.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">4. Analytics and performance</h2>
            <p className="mt-2">
              Where enabled, analytics or performance tools may help us understand website usage, diagnose errors and improve reliability. The exact technologies used can change as RoomKhoj features evolve.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">5. Third-party services</h2>
            <p className="mt-2">
              Features provided through external services, such as authentication, maps, hosting, communications or connected social platforms, may use their own cookies or browser technologies according to their policies when those features are used.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">6. Your controls</h2>
            <p className="mt-2">
              Most browsers let you view, block or remove cookies and site data. Removing stored data may sign you out, reset preferences or interrupt features that depend on saved session information.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold">7. Updates</h2>
            <p className="mt-2">
              We may update this policy when RoomKhoj changes how browser storage is used. The current version will be published on this page.
            </p>
          </section>
        </div>
      </article>
    </main>
  );
}
