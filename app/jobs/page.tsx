import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness } from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import ApprovedVacancies from "@/components/jobs/ApprovedVacancies";

const title = "Jobs in Nepal & Job Vacancies | RoomKhoj";

const description =
  "Search jobs and job vacancies across Nepal. Find waiter, cook, sales, hotel, caregiver, office, driver and part-time jobs with RoomKhoj.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,

  keywords: [
    "jobs in Nepal",
    "job vacancy in Nepal",
    "Nepal jobs",
    "latest jobs in Nepal",
    "part time jobs in Nepal",
    "jobs in Kathmandu",
    "jobs in Pokhara",
    "hotel jobs in Nepal",
    "sales jobs in Nepal",
  ],

  alternates: {
    canonical: "https://www.roomkhoj.com/jobs",
  },

  openGraph: {
    title,
    description,
    url: "https://www.roomkhoj.com/jobs",
    siteName: "RoomKhoj",
    locale: "en_NP",
    type: "website",
    images: [
      {
        url: "https://www.roomkhoj.com/roomkhoj-logo.png",
        width: 1254,
        height: 1254,
        alt: "Jobs in Nepal - RoomKhoj",
      },
    ],
  },

  robots: {
    index: true,
    follow: true,
  },
};

const jobCategories = [
  "Waiter and Restaurant Jobs",
  "Cook and Chef Jobs",
  "Sales and Marketing Jobs",
  "Hotel and Hospitality Jobs",
  "Caregiver Jobs",
  "Office and Reception Jobs",
  "Driver and Delivery Jobs",
  "Part-time Jobs",
];

const locations = [
  "Kathmandu",
  "Pokhara",
  "Lalitpur",
  "Bhaktapur",
  "Chitwan",
  "Butwal",
  "Biratnagar",
  "Dharan",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: title,
  description,
  url: "https://www.roomkhoj.com/jobs",
  about: {
    "@type": "Thing",
    name: "Job vacancies in Nepal",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "RoomKhoj",
    url: "https://www.roomkhoj.com",
  },
};

export default function NepalJobsPage() {
  return (
    <>
      <NavBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <main className="min-h-screen bg-slate-50 pt-20">
        <ApprovedVacancies />

        <section className="mx-auto max-w-6xl px-4 py-16">
          <p className="font-semibold text-red-600">
            Popular job categories
          </p>

          <h2 className="mt-2 text-3xl font-bold text-slate-900">
            तपाईं कुन काम खोज्दै हुनुहुन्छ?
          </h2>

          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {jobCategories.map((category) => (
              <div
                key={category}
                className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
              >
                <BriefcaseBusiness className="mb-4 h-7 w-7 text-red-600" />
                <h3 className="font-semibold text-slate-900">
                  {category}
                </h3>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-16">
          <div className="mx-auto max-w-6xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Popular job locations in Nepal
            </h2>

            <div className="mt-7 flex flex-wrap gap-3">
              {locations.map((location) =>
                location === "Pokhara" ? (
                  <Link
                    key={location}
                    href="/jobs/pokhara"
                    className="rounded-full border border-red-300 bg-red-100 px-4 py-2 font-semibold text-red-700"
                  >
                    Jobs in Pokhara
                  </Link>
                ) : (
                  <span
                    key={location}
                    className="rounded-full border border-slate-200 bg-slate-50 px-4 py-2 font-medium text-slate-700"
                  >
                    Jobs in {location}
                  </span>
                ),
              )}
            </div>
          </div>
        </section>

        <section
          id="how-to-find-job"
          className="mx-auto max-w-6xl px-4 py-16"
        >
          <div className="rounded-3xl bg-slate-900 p-8 text-white">
            <h2 className="text-3xl font-bold">
              RoomKhoj बाट job कसरी खोज्ने?
            </h2>

            <ol className="mt-6 space-y-4 text-slate-200">
              <li>1. स्क्रिनमा देखिएको Chatbot खोल्नुहोस्।</li>
              <li>2. “I need a job” लेख्नुहोस्।</li>
              <li>3. आफ्नो location, काम र अनुभव बताउनुहोस्।</li>
            </ol>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
