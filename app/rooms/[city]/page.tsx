import type { Metadata } from "next";
import Link from "next/link";
import { Home, MapPin, Search } from "lucide-react";
import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
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

  const title = `Room for Rent in ${city.name}, Nepal | RoomKhoj`;
  return {
    title: { absolute: title },
    description: city.roomDescription,
    keywords: [
      `room for rent in ${city.name}`,
      `rooms for rent in ${city.name}`,
      `room rent ${city.name}`,
      `flat for rent in ${city.name}`,
      `house for rent in ${city.name}`,
      `apartment for rent in ${city.name}`,
    ],
    alternates: { canonical: `${baseUrl}/rooms/${city.slug}` },
    openGraph: {
      title,
      description: city.roomDescription,
      url: `${baseUrl}/rooms/${city.slug}`,
      siteName: "RoomKhoj",
      locale: "en_NP",
      type: "website",
      images: [{ url: `${baseUrl}/roomkhoj-logo.png`, width: 1254, height: 1254, alt: title }],
    },
    robots: { index: true, follow: true },
  };
}

export default async function CityRoomsPage({
  params,
}: {
  params: Promise<{ city: string }>;
}) {
  const { city: slug } = await params;
  const city = getNepalCity(slug);
  if (!city) return null;

  const otherCities = NEPAL_CITIES.filter((item) => item.slug !== city.slug).slice(0, 12);
  const title = `Room for Rent in ${city.name}, Nepal | RoomKhoj`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: title,
    description: city.roomDescription,
    url: `${baseUrl}/rooms/${city.slug}`,
    about: { "@type": "Thing", name: `Rental rooms in ${city.name}` },
    isPartOf: { "@type": "WebSite", name: "RoomKhoj", url: baseUrl },
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Rooms", item: `${baseUrl}/rooms` },
        { "@type": "ListItem", position: 2, name: city.name, item: `${baseUrl}/rooms/${city.slug}` },
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
              Room for Rent in {city.name}
            </h1>
            <p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
              {city.roomDescription}
            </p>
            <Link
              href={city.roomSearchHref}
              className="mt-8 inline-flex items-center gap-2 rounded-xl bg-red-600 px-6 py-3 font-semibold text-white hover:bg-red-700"
            >
              <Search className="h-5 w-5" />
              Search {city.name} Rooms
            </Link>
          </div>
        </section>

        <section className="mx-auto max-w-5xl px-4 py-14">
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ["Single rooms", "Search for single rooms and shared accommodation in " + city.name + "."],
              ["Flats & apartments", "Browse larger rental properties in " + city.name + " when listings are available."],
              ["Houses", "Search houses for rent in " + city.name + " by property type and budget."],
            ].map(([heading, text]) => (
              <div key={heading} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <Home className="mb-4 h-7 w-7 text-red-600" />
                <h2 className="font-bold text-slate-900">{heading}</h2>
                <p className="mt-2 text-sm leading-6 text-slate-600">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="bg-white px-4 py-14">
          <div className="mx-auto max-w-5xl">
            <h2 className="text-3xl font-bold text-slate-900">
              Search rooms across Nepal
            </h2>
            <p className="mt-3 text-slate-600">
              Room availability changes as owners add or remove listings. Use RoomKhoj search to see the current listings rather than relying on a static list.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              {otherCities.map((item) => (
                <Link
                  key={item.slug}
                  href={`/rooms/${item.slug}`}
                  className="rounded-full border border-red-200 bg-red-50 px-4 py-2 font-medium text-red-700 hover:bg-red-100"
                >
                  Rooms in {item.name}
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
