import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  MessageCircle,
  Search,
  ShieldCheck,
} from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";

export const metadata: Metadata = {
  title: "About RoomKhoj | Rooms and Jobs in Nepal",
  description:
    "Learn how RoomKhoj helps people discover rooms, flats, houses and job opportunities across Nepal.",
};

const services = [
  {
    icon: Search,
    title: "Find a place",
    description:
      "Browse rooms, flats and houses using location, budget and other useful listing details.",
  },
  {
    icon: Building2,
    title: "List a property",
    description:
      "Owners and agents can publish room information and manage their listings from RoomKhoj.",
  },
  {
    icon: BriefcaseBusiness,
    title: "Discover jobs",
    description:
      "Job seekers can explore vacancies while employers can publish opportunities and review candidate information where available.",
  },
  {
    icon: MessageCircle,
    title: "Communicate",
    description:
      "Supported room and job flows can continue through RoomKhoj messaging so important context stays connected.",
  },
];

export default function AboutPage() {
  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 pt-28 text-slate-800">
        <section className="px-4 pb-16 pt-10 sm:px-6">
          <div className="mx-auto max-w-5xl rounded-3xl bg-white p-7 shadow-sm sm:p-12">
            <div className="max-w-3xl">
              <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
                About RoomKhoj
              </p>
              <h1 className="mt-4 text-4xl font-bold tracking-tight text-slate-950 sm:text-5xl">
                A practical platform for rooms and jobs in Nepal
              </h1>
              <p className="mt-6 text-lg leading-8 text-slate-600">
                RoomKhoj is built to make room discovery, property listing and
                job discovery easier from one place. The platform connects
                people looking for accommodation or work with owners, agents
                and employers who have relevant opportunities to share.
              </p>
            </div>

            <div className="mt-10 grid gap-5 sm:grid-cols-2">
              {services.map((service) => (
                <div
                  key={service.title}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <service.icon className="h-6 w-6 text-primary" />
                  <h2 className="mt-4 text-xl font-semibold text-slate-950">
                    {service.title}
                  </h2>
                  <p className="mt-2 leading-7 text-slate-600">
                    {service.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 rounded-2xl border border-slate-200 p-6 sm:p-8">
              <div className="flex items-start gap-4">
                <ShieldCheck className="mt-1 h-7 w-7 shrink-0 text-primary" />
                <div>
                  <h2 className="text-2xl font-semibold text-slate-950">
                    Clear information and safer decisions
                  </h2>
                  <p className="mt-3 leading-7 text-slate-600">
                    RoomKhoj provides tools and information to support better
                    decisions, but users should still verify a property,
                    employer, payment request and important terms before making
                    a commitment.
                  </p>
                  <Link
                    href="/safety"
                    className="mt-4 inline-flex items-center gap-2 font-semibold text-primary hover:underline"
                  >
                    Read safety tips <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </div>

            <div className="mt-10 flex flex-wrap gap-3">
              <Link
                href="/rooms"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-3 font-semibold text-white"
              >
                Browse rooms <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/jobs"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800"
              >
                Browse jobs
              </Link>
              <Link
                href="/contact"
                className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 font-semibold text-slate-800"
              >
                Contact RoomKhoj
              </Link>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
