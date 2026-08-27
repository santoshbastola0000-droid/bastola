"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Loader2,
  MapPin,
  Search,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { privateApi } from "@/http/api/privateApi";
import { profileMediaUrl } from "@/lib/profile-media";
import { featureSettingsService } from "@/http/services/feature-settings.service";

type Person = {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  profilePhotoUrl?: string | null;
};

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] =
    useState<Person[]>([]);
  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);

  const loadPeople = async (
    term = "",
  ) => {
    try {
      setLoading(true);

      const response =
        await privateApi.get(
          "/user/people",
          {
            params: term.trim()
              ? { search: term.trim() }
              : {},
          },
        );

      setPeople(
        Array.isArray(response.data)
          ? response.data
          : [],
      );
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message ||
          "People load गर्न सकिएन।",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    featureSettingsService
      .getPeople()
      .then((setting) => {
        if (!setting.enabled) {
          router.replace("/user/dashboard");
          return;
        }
        loadPeople();
      })
      .catch(() => router.replace("/user/dashboard"));
  }, []);

  const submitSearch = (
    event: FormEvent,
  ) => {
    event.preventDefault();
    loadPeople(search);
  };

  return (
    <main className="mx-auto w-full max-w-5xl p-4 pb-24 sm:p-6">
      <div className="rounded-3xl border bg-background p-5 shadow-sm sm:p-7">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">
            Find People
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            नाम वा location बाट RoomKhoj users खोज्नुहोस्।
          </p>
        </div>

        <form
          onSubmit={submitSearch}
          className="mt-6 flex gap-2"
        >
          <Input
            value={search}
            onChange={(event) =>
              setSearch(event.target.value)
            }
            placeholder="Search name or location..."
            className="h-12 rounded-xl"
          />
          <Button
            type="submit"
            className="h-12 gap-2 rounded-xl px-5"
            disabled={loading}
          >
            <Search className="h-4 w-4" />
            Search
          </Button>
        </form>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-7 w-7 animate-spin text-muted-foreground" />
        </div>
      ) : people.length === 0 ? (
        <div className="mt-5 rounded-3xl border bg-background p-12 text-center text-muted-foreground">
          कुनै user भेटिएन।
        </div>
      ) : (
        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {people.map((person) => {
            const photo =
              profileMediaUrl(
                person.profilePhotoUrl,
              );

            return (
              <article
                key={person.id}
                className="overflow-hidden rounded-3xl border bg-background p-5 shadow-sm"
              >
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/profile/${person.id}`,
                    )
                  }
                  className="block w-full text-left"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted">
                      {photo ? (
                        <img
                          src={photo}
                          alt={person.name}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <UserRound className="h-7 w-7 text-muted-foreground" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h2 className="truncate font-bold">
                          {person.name}
                        </h2>
                        {person.isVerified && (
                          <BadgeCheck className="h-4 w-4 shrink-0 text-blue-500" />
                        )}
                      </div>

                      {person.location && (
                        <p className="mt-1 flex items-center gap-1 text-sm text-muted-foreground">
                          <MapPin className="h-3.5 w-3.5" />
                          <span className="truncate">
                            {person.location}
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {person.bio && (
                    <p className="mt-4 line-clamp-2 text-sm text-muted-foreground">
                      {person.bio}
                    </p>
                  )}
                </button>

                <Button
                  type="button"
                  variant="outline"
                  className="mt-5 w-full rounded-xl"
                  onClick={() =>
                    router.push(
                      `/profile/${person.id}`,
                    )
                  }
                >
                  View Profile
                </Button>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
