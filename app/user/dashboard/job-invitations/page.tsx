'use client';

import {
  useEffect,
  useState,
} from 'react';

import {
  BriefcaseBusiness,
  Check,
  X,
} from 'lucide-react';

type Invitation = {
  id: string;

  status:
    | 'PENDING'
    | 'ACCEPTED'
    | 'REJECTED';

  message?: string | null;

  job?: {
    companyName?: string;
    jobTitle?: string;
    location?: string;
    salary?: number | null;
  };
};

export default function JobInvitationsPage() {
  const [items, setItems] =
    useState<Invitation[]>([]);

  const [loading, setLoading] =
    useState(true);

  const api =
    process.env.NEXT_PUBLIC_API_URL;

  async function load() {
    if (!api) {
      setLoading(false);
      return;
    }

    try {
      const response = await fetch(
        `${api}/candidate-profile/invitations/me`,
        {
          credentials: 'include',
        },
      );

      if (!response.ok) {
        return;
      }

      const data =
        await response.json();

      setItems(
        Array.isArray(data)
          ? data
          : [],
      );
    } finally {
      setLoading(false);
    }
  }

  async function respond(
    id: string,
    action: 'accept' | 'reject',
  ) {
    if (!api) {
      return;
    }

    const response = await fetch(
      `${api}/candidate-profile/invitations/${id}/${action}`,
      {
        method: 'POST',
        credentials: 'include',
      },
    );

    if (response.ok) {
      await load();
    }
  }

  useEffect(() => {
    void load();
  }, []);

  if (loading) {
    return (
      <div className="p-6">
        Loading invitations...
      </div>
    );
  }

  return (
    <main className="mx-auto max-w-3xl p-4 pb-24">
      <div className="mb-5">
        <h1 className="text-2xl font-bold">
          Job Invitations
        </h1>

        <p className="mt-1 text-sm text-slate-600">
          Employer बाट आएका vacancy invitations यहाँ देखिन्छन्।
        </p>
      </div>

      {items.length === 0 ? (
        <div className="rounded-2xl border bg-white p-8 text-center text-slate-500">
          अहिले कुनै job invitation छैन।
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((invite) => (
            <article
              key={invite.id}
              className="rounded-2xl border bg-white p-5 shadow-sm"
            >
              <div className="flex gap-3">
                <div className="rounded-full bg-slate-100 p-2">
                  <BriefcaseBusiness className="h-5 w-5" />
                </div>

                <div className="flex-1">
                  <h2 className="font-semibold">
                    {invite.job?.jobTitle ||
                      'Job Invitation'}
                  </h2>

                  <p className="text-sm text-slate-600">
                    {invite.job?.companyName ||
                      'Employer'}
                  </p>

                  {invite.job?.location && (
                    <p className="mt-2 text-sm">
                      Location:{' '}
                      {invite.job.location}
                    </p>
                  )}

                  {invite.job?.salary && (
                    <p className="text-sm">
                      Salary: Rs.{' '}
                      {invite.job.salary}
                    </p>
                  )}

                  {invite.message && (
                    <p className="mt-3 rounded-xl bg-slate-50 p-3 text-sm">
                      {invite.message}
                    </p>
                  )}

                  <p className="mt-3 text-xs font-medium">
                    Status: {invite.status}
                  </p>

                  {invite.status ===
                    'PENDING' && (
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() =>
                          respond(
                            invite.id,
                            'accept',
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm text-white"
                      >
                        <Check className="h-4 w-4" />
                        Accept
                      </button>

                      <button
                        onClick={() =>
                          respond(
                            invite.id,
                            'reject',
                          )
                        }
                        className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm"
                      >
                        <X className="h-4 w-4" />
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
