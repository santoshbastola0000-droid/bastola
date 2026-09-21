import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import ApprovedVacancies from "@/components/jobs/ApprovedVacancies";
import {
  POKHARA_JOB_ROLES,
  getPokharaJobRole,
} from "@/lib/seo-landings";

const baseUrl = "https://www.roomkhoj.com";

export function generateStaticParams() {
  return POKHARA_JOB_ROLES.map((role) => ({ jobTitle: role.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobTitle: string }>;
}): Promise<Metadata> {
  const { jobTitle } = await params;
  const role = getPokharaJobRole(jobTitle);

  if (!role) {
    return {
      title: "Jobs in Pokhara | RoomKhoj",
      robots: { index: false, follow: true },
    };
  }

  const canonical = `${baseUrl}/jobs/pokhara/${role.slug}`;
  const title = `${role.title} Jobs in Pokhara | RoomKhoj`;

  return {
    title,
    description: role.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "RoomKhoj",
      url: canonical,
      title,
      description: role.description,
      images: ["/roomkhoj-logo.png"],
    },
  };
}

export default async function PokharaJobTitlePage({
  params,
}: {
  params: Promise<{ jobTitle: string }>;
}) {
  const { jobTitle } = await params;
  const role = getPokharaJobRole(jobTitle);
  if (!role) notFound();

  const canonical = `${baseUrl}/jobs/pokhara/${role.slug}`;
  const faqs = [
    {
      question: `Where can I find ${role.title.toLowerCase()} jobs in Pokhara?`,
      answer:
        "RoomKhoj groups approved job vacancies and lets you search by job title and Pokhara location.",
    },
    {
      question: "Can job availability change?",
      answer:
        "Yes. Vacancies and application deadlines can change, so check the live approved vacancy list for the latest status.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: `${role.title} Jobs in Pokhara`,
        description: role.description,
        url: canonical,
        isPartOf: {
          "@type": "WebSite",
          name: "RoomKhoj",
          url: baseUrl,
        },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "RoomKhoj", item: baseUrl },
          { "@type": "ListItem", position: 2, name: "Jobs", item: `${baseUrl}/jobs` },
          { "@type": "ListItem", position: 3, name: "Pokhara", item: `${baseUrl}/jobs/pokhara` },
          { "@type": "ListItem", position: 4, name: role.title, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: { "@type": "Answer", text: faq.answer },
        })),
      },
    ],
  };

  return (
    <>
      <NavBar />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
      />
      <main className="min-h-screen bg-slate-50 pb-20 pt-24">
        <section className="mx-auto max-w-6xl px-4">
          <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/jobs" className="hover:underline">Jobs</Link>
            <span className="px-2">/</span>
            <Link href="/jobs/pokhara" className="hover:underline">Pokhara</Link>
            <span className="px-2">/</span>
            <span>{role.title}</span>
          </nav>

          <div className="mt-5 rounded-3xl border bg-white p-6 shadow-sm md:p-9">
            <p className="font-bold text-red-600">Pokhara job guide</p>
            <h1 className="mt-2 text-3xl font-black md:text-5xl">
              {role.title} Jobs in Pokhara
            </h1>
            <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
              {role.description}
            </p>
          </div>
        </section>

        <ApprovedVacancies
          defaultSearch={role.searchTerm}
          defaultLocation="Pokhara"
        />

        <section className="mx-auto max-w-6xl px-4">
          <div className="rounded-3xl border bg-white p-6 md:p-8">
            <h2 className="text-2xl font-black">Frequently asked questions</h2>
            <div className="mt-5 space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-bold">{faq.question}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>

            <div className="mt-7 flex flex-wrap gap-2">
              {POKHARA_JOB_ROLES.filter((item) => item.slug !== role.slug).map(
                (item) => (
                  <Link
                    key={item.slug}
                    href={`/jobs/pokhara/${item.slug}`}
                    className="rounded-full border px-4 py-2 text-sm font-semibold hover:border-red-300"
                  >
                    {item.title} jobs
                  </Link>
                ),
              )}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
