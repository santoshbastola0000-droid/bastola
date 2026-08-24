import type { Metadata } from "next";
import { notFound } from "next/navigation";
import {
  BriefcaseBusiness,
  Building2,
  MapPin,
  WalletCards,
} from "lucide-react";

import { NavBar } from "@/components/common/navbar";
import Footer from "@/components/common/footer";
import JobContactUnlock from "@/components/jobs/JobContactUnlock";
import type { JobPosting } from "@/http/services/job-posting.service";

const API_URL =
  process.env.NEXT_PUBLIC_BACKEND_URL ||
  "https://api.roomkhoj.com";

function extractId(slug: string) {
  const match = slug.match(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/i,
  );

  return match?.[0] || null;
}

async function getJob(slug: string) {
  const id = extractId(slug);

  if (!id) {
    return null;
  }

  const response = await fetch(
    `${API_URL}/job-posting/${id}`,
    {
      next: {
        revalidate: 60,
      },
    },
  );

  if (!response.ok) {
    return null;
  }

  return (await response.json()) as JobPosting;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    return {
      title: "Job not found | RoomKhoj",
    };
  }

  const title =
    `${job.jobTitle} Job in ${job.location} | RoomKhoj`;

  return {
    title,
    description:
      job.description ||
      `Apply for ${job.jobTitle} at ${job.companyName || "an employer"} in ${job.location}.`,
    alternates: {
      canonical:
        `https://roomkhoj.com/job/${slug}`,
    },
  };
}

export default async function JobDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const job = await getJob(slug);

  if (!job) {
    notFound();
  }

  const salary =
    job.salaryNegotiable
      ? "Negotiable"
      : job.salary
        ? `रु ${Number(
            job.salary,
          ).toLocaleString()}`
        : "Not specified";

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: job.jobTitle,
    description:
      job.description || job.jobTitle,
    datePosted: job.createdAt,
    validThrough:
      job.applicationDeadline || undefined,
    hiringOrganization: {
      "@type": "Organization",
      name:
        job.companyName || "RoomKhoj Employer",
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        addressLocality: job.location,
        addressCountry: "NP",
      },
    },
  };

  return (
    <>
      <NavBar />

      <main className="min-h-screen bg-slate-50 px-4 pb-20 pt-28">
        <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-[1fr_360px]">
          <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50">
              <BriefcaseBusiness className="h-7 w-7 text-red-600" />
            </div>

            <h1 className="mt-5 text-3xl font-bold text-slate-900">
              {job.jobTitle}
            </h1>

            <div className="mt-5 grid gap-3 text-slate-700 sm:grid-cols-2">
              <p className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-red-600" />
                {job.companyName ||
                  "Company not specified"}
              </p>

              <p className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                {job.location}
              </p>

              <p className="flex items-center gap-2">
                <WalletCards className="h-5 w-5 text-red-600" />
                {salary}
              </p>
            </div>

            {job.description && (
              <div className="mt-7 border-t pt-6">
                <h2 className="text-xl font-bold">
                  Job description
                </h2>
                <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-700">
                  {job.description}
                </p>
              </div>
            )}

            {job.requiredSkills &&
              job.requiredSkills.length > 0 && (
                <div className="mt-7">
                  <h2 className="text-xl font-bold">
                    Required skills
                  </h2>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {job.requiredSkills.map(
                      (skill) => (
                        <span
                          key={skill}
                          className="rounded-full bg-slate-100 px-3 py-1 text-sm"
                        >
                          {skill}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              )}
          </article>

          <aside>
            <JobContactUnlock
              jobId={job.id}
              jobTitle={job.jobTitle}
            />
          </aside>
        </div>
      </main>

      <Footer />

      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(
            structuredData,
          ).replace(/</g, "\\u003c"),
        }}
      />
    </>
  );
}
