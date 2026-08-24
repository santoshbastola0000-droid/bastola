import type { Metadata } from "next";
import { Suspense } from "react";
import {
  BriefcaseBusiness,
  CheckCircle2,
  MapPin,
  Search,
} from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import ApprovedVacancies from "@/components/jobs/ApprovedVacancies";
import ShareOpenTracker from "@/components/jobs/ShareOpenTracker";

const title = "Jobs in Pokhara & Job Vacancy in Pokhara | RoomKhoj";

const description =
  "Search jobs and job vacancies in Pokhara for waiter, cook, sales, hotel, caregiver, office and other roles. Find opportunities with RoomKhoj.";

export const metadata: Metadata = {
  title: {
    absolute: title,
  },
  description,

  keywords: [
    "jobs in Pokhara",
    "job vacancy in Pokhara",
    "Pokhara jobs",
    "latest jobs in Pokhara",
    "part time jobs in Pokhara",
    "waiter job in Pokhara",
    "cook job in Pokhara",
    "sales job in Pokhara",
    "hotel jobs in Pokhara",
  ],

  alternates: {
    canonical: "https://www.roomkhoj.com/jobs/pokhara",
  },

  openGraph: {
    title,
    description,
    url: "https://www.roomkhoj.com/jobs/pokhara",
    siteName: "RoomKhoj",
    locale: "en_NP",
    type: "website",
    images: [
      {
        url: "https://www.roomkhoj.com/roomkhoj-logo.png",
        width: 1254,
        height: 1254,
        alt: "Jobs in Pokhara - RoomKhoj",
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

const pokharaAreas = [
  "Lakeside",
  "New Road",
  "Chipledhunga",
  "Mahendrapul",
  "Prithvi Chowk",
  "Bagar",
];

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "CollectionPage",
  name: title,
  description,
  url: "https://www.roomkhoj.com/jobs/pokhara",
  about: {
    "@type": "Thing",
    name: "Job vacancies in Pokhara",
  },
  isPartOf: {
    "@type": "WebSite",
    name: "RoomKhoj",
    url: "https://www.roomkhoj.com",
  },
};

export default function PokharaJobsPage() {
  return (
    <>
      <Suspense fallback={null}><ShareOpenTracker /></Suspense>
      <NavBar />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd),
        }}
      />

      <main className="min-h-screen bg-slate-50">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-4 py-20 text-white">
          <div className="mx-auto max-w-6xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              <MapPin className="h-4 w-4" />
              Pokhara, Nepal
            </div>

            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Jobs in Pokhara
              <span className="block text-red-500">
                Job Vacancy in Pokhara
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              Pokhara मा waiter, cook, sales, hotel, caregiver, office तथा
              अन्य काम खोज्नुहोस्। RoomKhoj chatbot प्रयोग गरेर आफ्नो
              अनुभव र रुचिअनुसार job opportunities पत्ता लगाउनुहोस्।
            </p>

            <a
              href="#how-to-find-job"
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white transition hover:bg-red-700"
            >
              <Search className="h-5 w-5" />
              Pokhara मा Job खोज्नुहोस्
            </a>
          </div>
        </section>

        <section
          id="job-categories"
          className="mx-auto max-w-6xl px-4 py-16"
        >
          <div className="mb-8">
            <p className="font-semibold text-red-600">
              Popular job categories
            </p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Pokhara मा कुन काम खोज्दै हुनुहुन्छ?
            </h2>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
              Popular job locations in Pokhara
            </h2>

            <div className="mt-7 flex flex-wrap gap-3">
              {pokharaAreas.map((area) => (
                <span
                  key={area}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700"
                >
                  {area}
                </span>
              ))}
            </div>
          </div>
        </section>

        <ApprovedVacancies
          defaultLocation="Pokhara"
        />

        <section
          id="how-to-find-job"
          className="mx-auto max-w-6xl px-4 py-16"
        >
          <div className="rounded-3xl bg-slate-900 p-7 text-white md:p-10">
            <h2 className="text-3xl font-bold">
              RoomKhoj बाट job कसरी खोज्ने?
            </h2>

            <div className="mt-7 grid gap-5 md:grid-cols-3">
              {[
                "स्क्रिनमा देखिएको Chatbot खोल्नुहोस्।",
                "“I need a job in Pokhara” लेख्नुहोस्।",
                "आफ्नो job category, अनुभव र salary बताउनुहोस्।",
              ].map((step, index) => (
                <div
                  key={step}
                  className="rounded-2xl bg-white/10 p-5"
                >
                  <div className="mb-4 flex h-9 w-9 items-center justify-center rounded-full bg-red-600 font-bold">
                    {index + 1}
                  </div>
                  <p className="text-slate-200">{step}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex items-center gap-2 text-green-300">
              <CheckCircle2 className="h-5 w-5" />
              आफ्नो विवरण एकपटक दिएपछि matching jobs खोज्न सजिलो हुन्छ।
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </>
  );
}
