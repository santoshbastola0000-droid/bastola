"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Bot,
  BriefcaseBusiness,
  Home,
  Loader2,
  MapPin,
  Search,
  User,
  X,
} from "lucide-react";

import { privateApi } from "@/http/api/privateApi";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type AiProfile = {
  id: number;
  userId: string;
account?: {
  id?: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  isVerified?: boolean | null;
} | null;
  userName?: string | null;
  city?: string | null;
  budget?: string | null;
  roomType?: string | null;
  tenantType?: string | null;
  moveInDate?: string | null;
  exactLocation?: string | null;
  numberOfPeople?: number | null;
  vehicleType?: string | null;
  intent?: string | null;
  parkingRequired?: boolean | null;
  wifiRequired?: boolean | null;
  isFurnished?: boolean | null;
  jobType?: string | null;
  experience?: string | null;
  education?: string | null;
  salaryExpectation?: number | null;
  jobTitle?: string | null;
  description?: string | null;
  companyName?: string | null;
  extraInfo?: Record<string, any> | null;
};

function value(v: any) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "Yes" : "No";
  return String(v);
}

function Detail({
  label,
  value: detailValue,
}: {
  label: string;
  value: any;
}) {
  return (
    <div className="rounded-xl border bg-muted/20 p-3">
      <p className="mb-1 text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm font-medium">
        {value(detailValue)}
      </p>
    </div>
  );
}

export default function AiProfilesPage() {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<AiProfile | null>(null);

  const { data = [], isLoading, error, refetch } = useQuery({
    queryKey: ["admin-ai-profiles"],
    queryFn: async () => {
      const response = await privateApi.get("/ai-profile/admin/all");
      return (response.data?.data || []) as AiProfile[];
    },
    staleTime: 30_000,
  });

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();

    if (!q) return data;

    return data.filter((item) => {
      const job = item.extraInfo?.jobSearch || {};
      const room = item.extraInfo?.roomSearch || {};

      return [
        item.userId,
        item.userName,
        item.city,
        item.exactLocation,
        item.jobType,
        item.jobTitle,
        item.intent,
        job.userName,
        job.phone,
        job.contactPhone,
        job.location,
        job.jobLocation,
        job.jobTitle,
        job.jobType,
        room.city,
        room.exactLocation,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q));
    });
  }, [data, search]);

  if (isLoading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <Loader2 className="h-7 w-7 animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="mb-4 text-sm text-destructive">
            AI profiles load गर्न सकिएन।
          </p>
          <Button onClick={() => refetch()}>Retry</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-5 p-1 sm:p-2">
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <div className="flex items-center gap-2">
            <Bot className="h-6 w-6 text-red-600" />
            <h1 className="text-2xl font-bold">AI Profiles</h1>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            AI ले users बाट collect गरेको room र job information
          </p>
        </div>

        <Badge variant="outline" className="w-fit">
          {data.length} profiles
        </Badge>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, location, job, user ID..."
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="p-10 text-center">
            <Bot className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="font-medium">No AI profiles found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {filtered.map((profile) => {
            const job = profile.extraInfo?.jobSearch || {};

            return (
              <Card
                key={profile.id}
                className="transition hover:shadow-md"
              >
                <CardContent className="p-4">
                  <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-red-50 dark:bg-red-950/40">
                        <User className="h-5 w-5 text-red-600" />
                      </div>

                      <div className="min-w-0">
                        <p className="truncate font-semibold">
                          {profile.userName ||
                            job.userName ||
                            "Unknown User"}
                        </p>

                        <p className="truncate text-xs text-muted-foreground">
                          User ID: {profile.userId}
                        </p>

                        <div className="mt-2 flex flex-wrap gap-2">
                          {profile.intent && (
                            <Badge variant="secondary">
                              {profile.intent}
                            </Badge>
                          )}

                          {(profile.city || profile.exactLocation) && (
                            <Badge variant="outline">
                              <MapPin className="mr-1 h-3 w-3" />
                              {profile.exactLocation || profile.city}
                            </Badge>
                          )}

                          {(job.jobTitle ||
                            job.jobType ||
                            profile.jobTitle ||
                            profile.jobType) && (
                            <Badge variant="outline">
                              <BriefcaseBusiness className="mr-1 h-3 w-3" />
                              {job.jobTitle ||
                                job.jobType ||
                                profile.jobTitle ||
                                profile.jobType}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      variant="outline"
                      onClick={() => setSelected(profile)}
                    >
                      View AI Details
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {selected && (
        <div
          className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
          onClick={() => setSelected(null)}
        >
          <div
            className="max-h-[90dvh] w-full max-w-3xl overflow-y-auto rounded-t-3xl bg-background shadow-2xl sm:rounded-3xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/95 p-4 backdrop-blur">
              <div>
                <h2 className="font-bold">AI Saved Details</h2>
                <p className="text-xs text-muted-foreground">
                  {selected.account?.name ||
                    selected.userName ||
                    selected.extraInfo?.jobSearch?.userName ||
                    selected.userId}
                </p>
              </div>

              <Button
                size="icon"
                variant="ghost"
                onClick={() => setSelected(null)}
              >
                <X className="h-5 w-5" />
              </Button>
            </div>

            <div className="space-y-6 p-4 sm:p-6">
              <section>
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h3 className="font-semibold">Basic Information</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Name" value={
                    selected.account?.name ||
                    selected.userName ||
                    selected.extraInfo?.jobSearch?.userName
                  } />
                  <Detail label="User ID" value={selected.userId} />
                  <Detail label="Active Intent" value={selected.intent} />
                  <Detail
                    label="Phone"
                    value={
                      selected.extraInfo?.jobSearch?.phone ||
                      selected.extraInfo?.jobSearch?.contactPhone
                    }
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <h3 className="font-semibold">Account Information</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="Account Name" value={selected.account?.name} />
                  <Detail label="Email" value={selected.account?.email} />
                  <Detail label="Phone" value={selected.account?.phone} />
                  <Detail label="Role" value={selected.account?.role} />
                  <Detail
                    label="Verified"
                    value={selected.account?.isVerified}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  <h3 className="font-semibold">Room Search</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail label="City" value={selected.city} />
                  <Detail
                    label="Exact Location"
                    value={selected.exactLocation}
                  />
                  <Detail label="Budget" value={selected.budget} />
                  <Detail label="Room Type" value={selected.roomType} />
                  <Detail label="Tenant Type" value={selected.tenantType} />
                  <Detail
                    label="People"
                    value={selected.numberOfPeople}
                  />
                  <Detail
                    label="Move-in Date"
                    value={selected.moveInDate}
                  />
                  <Detail
                    label="Vehicle"
                    value={selected.vehicleType}
                  />
                  <Detail
                    label="Parking Required"
                    value={selected.parkingRequired}
                  />
                  <Detail
                    label="WiFi Required"
                    value={selected.wifiRequired}
                  />
                  <Detail
                    label="Furnished"
                    value={selected.isFurnished}
                  />
                </div>
              </section>

              <section>
                <div className="mb-3 flex items-center gap-2">
                  <BriefcaseBusiness className="h-4 w-4" />
                  <h3 className="font-semibold">Job Search</h3>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Detail
                    label="Preferred Job"
                    value={
                      selected.extraInfo?.jobSearch?.jobTitle ||
                      selected.extraInfo?.jobSearch?.preferredJob ||
                      selected.extraInfo?.jobSearch?.jobType ||
                      selected.jobTitle ||
                      selected.jobType
                    }
                  />
                  <Detail
                    label="Location"
                    value={
                      selected.extraInfo?.jobSearch?.jobLocation ||
                      selected.extraInfo?.jobSearch?.location
                    }
                  />
                  <Detail
                    label="Experience"
                    value={
                      selected.extraInfo?.jobSearch?.experience ||
                      selected.experience
                    }
                  />
                  <Detail
                    label="Education"
                    value={
                      selected.extraInfo?.jobSearch?.education ||
                      selected.education
                    }
                  />
                  <Detail
                    label="Expected Salary"
                    value={
                      selected.extraInfo?.jobSearch?.expectedSalary ||
                      selected.salaryExpectation
                    }
                  />
                  <Detail
                    label="Joining Availability"
                    value={
                      selected.extraInfo?.jobSearch?.joiningAvailability
                    }
                  />
                </div>
              </section>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
