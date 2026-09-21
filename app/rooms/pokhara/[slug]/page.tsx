import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import {
  POKHARA_ROOM_LANDINGS,
  getPokharaRoomLanding,
} from "@/lib/seo-landings";

const baseUrl = "https://www.roomkhoj.com";

export function generateStaticParams() {
  return POKHARA_ROOM_LANDINGS.map((item) => ({ slug: item.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const landing = getPokharaRoomLanding(slug);

  if (!landing) {
    return {
      title: "Room search | RoomKhoj",
      robots: { index: false, follow: true },
    };
  }

  const canonical = `${baseUrl}/rooms/pokhara/${landing.slug}`;

  return {
    title: landing.title,
    description: landing.description,
    alternates: { canonical },
    robots: { index: true, follow: true },
    openGraph: {
      type: "website",
      siteName: "RoomKhoj",
      url: canonical,
      title: landing.title,
      description: landing.description,
      images: ["/roomkhoj-logo.png"],
    },
  };
}

export default async function PokharaRoomLandingPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const landing = getPokharaRoomLanding(slug);
  if (!landing) notFound();

  const canonical = `${baseUrl}/rooms/pokhara/${landing.slug}`;
  const faqs = [
    {
      question: `How can I find ${landing.label.toLowerCase()} rooms in Pokhara?`,
      answer:
        "Use the RoomKhoj room search to compare available listings by area, monthly rent, property type and facilities.",
    },
    {
      question: "Does RoomKhoj show exact private owner location publicly?",
      answer:
        "RoomKhoj public discovery pages focus on area-level information. Private contact and sensitive location details are not published in SEO text.",
    },
    {
      question: "How often can rental availability change?",
      answer:
        "Rental availability can change quickly, so open the live search results to check the latest listing status before making a decision.",
    },
  ];

  const schema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: landing.title,
        description: landing.description,
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
          { "@type": "ListItem", position: 2, name: "Rooms", item: `${baseUrl}/rooms` },
          { "@type": "ListItem", position: 3, name: "Pokhara", item: `${baseUrl}/rooms/pokhara` },
          { "@type": "ListItem", position: 4, name: landing.label, item: canonical },
        ],
      },
      {
        "@type": "FAQPage",
        mainEntity: faqs.map((faq) => ({
          "@type": "Question",
          name: faq.question,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.answer,
          },
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

      <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28">
        <article className="mx-auto max-w-4xl">
          <nav className="text-sm text-slate-500" aria-label="Breadcrumb">
            <Link href="/rooms" className="hover:underline">Rooms</Link>
            <span className="px-2">/</span>
            <Link href="/rooms/pokhara" className="hover:underline">Pokhara</Link>
            <span className="px-2">/</span>
            <span>{landing.label}</span>
          </nav>

          <section className="mt-5 rounded-3xl border bg-white p-6 shadow-sm md:p-9">
            <p className="font-bold text-red-600">
              {landing.kind === "area" ? "Pokhara area guide" : "Pokhara budget guide"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-5xl">
              {landing.title}
            </h1>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              {landing.description}
            </p>

            <Link
              href={landing.searchHref}
              className="mt-7 inline-flex rounded-xl bg-red-600 px-5 py-3 font-bold text-white hover:bg-red-700"
            >
              View live RoomKhoj listings
            </Link>
          </section>

          <section className="mt-8 rounded-3xl border bg-white p-6 md:p-8">
            <h2 className="text-2xl font-black">What you can compare</h2>
            <ul className="mt-4 grid gap-3 text-slate-700 sm:grid-cols-2">
              <li className="rounded-xl bg-slate-50 p-4">Monthly rent and budget filters</li>
              <li className="rounded-xl bg-slate-50 p-4">Room, flat, apartment and house types</li>
              <li className="rounded-xl bg-slate-50 p-4">Area-level location information</li>
              <li className="rounded-xl bg-slate-50 p-4">Facilities and current listing status</li>
            </ul>
          </section>

          <section className="mt-8 rounded-3xl border bg-white p-6 md:p-8">
            <h2 className="text-2xl font-black">Frequently asked questions</h2>
            <div className="mt-5 space-y-5">
              {faqs.map((faq) => (
                <div key={faq.question}>
                  <h3 className="font-bold text-slate-900">{faq.question}</h3>
                  <p className="mt-2 leading-7 text-slate-600">{faq.answer}</p>
                </div>
              ))}
            </div>
          </section>

          <section className="mt-8">
            <h2 className="text-xl font-black">Explore more Pokhara room guides</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {POKHARA_ROOM_LANDINGS.filter((item) => item.slug !== landing.slug)
                .slice(0, 8)
                .map((item) => (
                  <Link
                    key={item.slug}
                    href={`/rooms/pokhara/${item.slug}`}
                    className="rounded-full border bg-white px-4 py-2 text-sm font-semibold hover:border-red-300"
                  >
                    {item.label}
                  </Link>
                ))}
            </div>
          </section>
        </article>
      </main>
      <Footer />
    </>
  );
}
