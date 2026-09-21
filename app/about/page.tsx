import type { Metadata } from "next";
import Link from "next/link";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";

export const metadata: Metadata = {
  title: "About RoomKhoj",
  description:
    "Learn about RoomKhoj, a Nepal-focused platform for finding rental rooms, flats, houses and job opportunities.",
  alternates: { canonical: "https://www.roomkhoj.com/about" },
};

const schema = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "About RoomKhoj",
  url: "https://www.roomkhoj.com/about",
  about: {
    "@type": "Organization",
    name: "RoomKhoj",
    url: "https://www.roomkhoj.com",
    logo: "https://www.roomkhoj.com/roomkhoj-logo.png",
  },
};

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28">
        <article className="mx-auto max-w-4xl">
          <section className="rounded-3xl border bg-white p-7 shadow-sm md:p-10">
            <p className="font-bold text-red-600">About RoomKhoj</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-slate-950 md:text-6xl">
              Rooms and jobs, easier to discover
            </h1>
            <p className="mt-6 text-lg leading-8 text-slate-600">
              RoomKhoj is a Nepal-focused platform designed to help people discover
              rental rooms, flats, apartments and houses, while also providing a
              place to browse approved job vacancies.
            </p>
          </section>

          <section className="mt-7 grid gap-4 md:grid-cols-2">
            <div className="rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-black">For room seekers</h2>
              <p className="mt-3 leading-7 text-slate-600">
                Search by city, area, budget, property type and facilities, then
                open the current listing to check its latest availability.
              </p>
              <Link href="/rooms" className="mt-4 inline-block font-bold text-red-600">
                Browse rooms →
              </Link>
            </div>
            <div className="rounded-3xl border bg-white p-6">
              <h2 className="text-xl font-black">For job seekers and employers</h2>
              <p className="mt-3 leading-7 text-slate-600">
                Browse approved vacancies or use RoomKhoj job tools to discover
                opportunities by role and location.
              </p>
              <Link href="/jobs" className="mt-4 inline-block font-bold text-red-600">
                Browse jobs →
              </Link>
            </div>
          </section>

          <section className="mt-7 rounded-3xl border bg-white p-6 md:p-8">
            <h2 className="text-2xl font-black">Public discovery and privacy</h2>
            <p className="mt-4 leading-7 text-slate-600">
              RoomKhoj keeps public discovery pages focused on useful listing,
              location and job information. Sensitive contact details and exact
              private location data are not intended to be exposed through public
              SEO pages.
            </p>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
