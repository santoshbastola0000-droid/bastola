import type { Metadata } from "next";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import ApprovedVacancies from "@/components/jobs/ApprovedVacancies";

function readable(value: string) {
  return decodeURIComponent(value)
    .replace(/-/g, " ")
    .replace(/\b\w/g, (letter) =>
      letter.toUpperCase(),
    );
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ jobTitle: string }>;
}): Promise<Metadata> {
  const { jobTitle } = await params;
  const title = readable(jobTitle);

  return {
    title:
      `${title} Jobs in Pokhara | RoomKhoj`,
    description:
      `Find ${title} job vacancies in Pokhara.`,
  };
}

export default async function PokharaJobTitlePage({
  params,
}: {
  params: Promise<{ jobTitle: string }>;
}) {
  const { jobTitle } = await params;

  return (
    <>
      <NavBar />
      <main className="min-h-screen bg-slate-50 pt-20">
        <ApprovedVacancies
          defaultSearch={readable(jobTitle)}
          defaultLocation="Pokhara"
        />
      </main>
      <Footer />
    </>
  );
}
