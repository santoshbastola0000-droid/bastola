import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Sitemap | RoomKhoj",
  description: "Browse the main RoomKhoj pages and resources.",
};

const sections = [
  {
    title: "Find",
    links: [
      { href: "/", label: "Home" },
      { href: "/rooms", label: "Rooms" },
      { href: "/jobs", label: "Jobs" },
    ],
  },
  {
    title: "Publish",
    links: [
      { href: "/user/dashboard/rooms/create", label: "List a Room" },
      { href: "/user/dashboard/profile", label: "Profile" },
      { href: "/messages", label: "Messages" },
    ],
  },
  {
    title: "RoomKhoj",
    links: [
      { href: "/about", label: "About" },
      { href: "/contact", label: "Contact" },
      { href: "/faq", label: "Help & FAQs" },
      { href: "/safety", label: "Safety Tips" },
    ],
  },
  {
    title: "Legal",
    links: [
      { href: "/terms", label: "Terms of Service" },
      { href: "/privacy", label: "Privacy Policy" },
      { href: "/cookies", label: "Cookie Policy" },
    ],
  },
];

export default function SitemapPage() {
  return (
    <main className="min-h-screen bg-slate-50 px-4 py-12 text-slate-800">
      <div className="mx-auto max-w-5xl">
        <h1 className="text-4xl font-bold text-slate-950">Sitemap</h1>
        <p className="mt-3 text-slate-600">
          Jump directly to the main RoomKhoj pages.
        </p>

        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {sections.map((section) => (
            <section
              key={section.title}
              className="rounded-2xl bg-white p-6 shadow-sm"
            >
              <h2 className="text-lg font-semibold text-slate-950">
                {section.title}
              </h2>
              <ul className="mt-4 space-y-3">
                {section.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-slate-600 hover:text-primary hover:underline"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}
