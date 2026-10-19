import type { Metadata } from "next";
import Link from "next/link";
import { BriefcaseBusiness, MapPin, Search } from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import ApprovedVacancies from "@/components/jobs/ApprovedVacancies";
import { NEPAL_CITIES, getNepalCity } from "@/lib/seo-landings";

const baseUrl = "https://www.roomkhoj.com";

export const dynamicParams = false;

export function generateStaticParams() {
  return NEPAL_CITIES.filter((city) => city.slug !== "pokhara").map((city) => ({
    city: city.slug,
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ city: string }>;
}): Promise<Metadata> {
  const { city: slug } = await params;
  const city = getNepalCity(slug);
  if (!city) return {};

  const title = `Jobs in ${city.name}, Nepal | Job Vacancies | RoomKhoj`;
  return {
    title: { absolute: title },
    description: city.jobDescription,
    keywords: [
      `jobs in ${city.name}`,
      `job vacancy in ${city.name}`,
      `${city.name} jobs`,
      `latest jobs in ${city.name}`,
      `part time jobs in ${city.name}`,
    ],
    alternates: { canonical: `${baseUrl}/jobs/${city.slug}` },
    openGraph: {
      title,
      description: city.jobDescription,
      url: `${baseUrl}/jobs/${city.slug}`,
      siteName: "RoomKhoj",
      locale: "en_NP",
      type: "website",
      images: [{ url: `${baseUrl}/roomkhoj-logo.png`, width: 1254, height: 1254, alt: title }],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CityJobsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getNepalCity(slug);
  if (!city) return null;

  const otherCities = NEPAL_CITIES.filter((item) => item.slug !== city.slug).slice(0, 12);
  const title = `Jobs in ${city.name}, Nepal | Job Vacancies | RoomKhoj`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: city.jobDescription,
    url: `${baseUrl}/jobs/${city.slug}`,
    about: { "@type": "Thing", name: `Job vacancies in ${city.name}` },
    isPartOf: { "@type": "WebSite", name: "RoomKhoj", url: baseUrl },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Jobs", item: `${baseUrl}/jobs` },
        { "@type": "ListItem", position: 2, name: city.name, item: `${baseUrl}/jobs/${city.slug}` },
      ],
    },
  };

  return (
    <>
      <NavBar />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <main className="min-h-screen bg-slate-50">
        <section className="bg-gradient-to-br from-slate-950 via-slate-900 to-red-950 px-4 py-20 text-white">
          <div className="mx-auto max-w-5xl text-center">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-4 py-2 text-sm text-red-200">
              <MapPin className="h-4 w-4" />
              {city.name}, Nepal
            </div>
            <h1 className="text-4xl font-black tracking-tight md:text-6xl">
              Jobs in {city.name}
              <span className="block text-red-500">Job Vacancies in {city.name}</span>
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {city.jobDescription}
            </p>
            <Link
              href={city.jobSearchHref}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
            >
              <Search className="h-5 w-5" />
              Search {city.name} Jobs
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-5 md:grid-cols-4">
            {[
              "Waiter & restaurant jobs",
              "Cook & kitchen jobs",
              "Sales & retail jobs",
              "Office, driver & other jobs",
            ].map((category) => (
              <div key={category} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <BriefcaseBusiness className="mb-4 h-7 w-7 text-red-600" />
                <h2 className="font-bold text-slate-900">{category}</h2>
              </div>
            ))}
          </div>
        </section>

        <ApprovedVacancies defaultLocation={city.name} />

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-slate-900">Jobs across Nepal</h2>
            <p className="mt-3 text-slate-600">
              Vacancies change as employers publish and close positions. RoomKhoj shows approved vacancies; always check the current listing before applying.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {otherCities.map((item) => (
                <Link
                  key={item.slug}
                  href={`/jobs/${item.slug}`}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100"
                >
                  Jobs in {item.name}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
