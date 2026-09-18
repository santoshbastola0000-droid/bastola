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
  UserPlus,
  Check,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { privateApi } from "@/http/api/privateApi";
import { profileMediaUrl } from "@/lib/profile-media";

type Person = {
  id: string;
  name: string;
  bio?: string | null;
  location?: string | null;
  isVerified?: boolean;
  isPremium?: boolean;
  profilePhotoUrl?: string | null;
  mutualFriends?: number;
  reason?: string;
};

export default function PeoplePage() {
  const router = useRouter();
  const [people, setPeople] =
    useState<Person[]>([]);
  const [requests, setRequests] = useState<Person[]>([]);
  const [search, setSearch] =
    useState("");
  const [loading, setLoading] =
    useState(true);
  const [friendStatus, setFriendStatus] = useState<Record<string, string>>({});
  const [friendBusy, setFriendBusy] = useState<string | null>(null);

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

      const rows = Array.isArray(response.data) ? response.data : [];
      setPeople(rows);
      const statuses = await Promise.all(
        rows.map(async (person: Person) => {
          try {
            const status = await privateApi.get(`/friend/status/${person.id}`);
            return [person.id, String(status.data?.status || "NONE")] as const;
          } catch {
            return [person.id, "NONE"] as const;
          }
        }),
      );
      setFriendStatus(Object.fromEntries(statuses));
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
    const loadSuggestions = async () => {
      try {
        setLoading(true);
        const [suggestionResponse, requestResponse] = await Promise.all([
          privateApi.get("/friend/suggestions"),
          privateApi.get("/friend/requests"),
        ]);
        const rows = Array.isArray(suggestionResponse.data) ? suggestionResponse.data : [];
        const incoming = Array.isArray(requestResponse.data) ? requestResponse.data : [];
        setPeople(rows);
        setRequests(incoming);
        setFriendStatus({
          ...Object.fromEntries(rows.map((person: Person) => [person.id, "NONE"])),
          ...Object.fromEntries(incoming.map((person: Person) => [person.id, "REQUEST_RECEIVED"])),
        });
      } catch {
        await loadPeople();
      } finally {
        setLoading(false);
      }
    };
    void loadSuggestions();
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
            Friends
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            RoomKhoj मा साथी खोज्नुहोस्, friend request पठाउनुहोस् र आफ्नो network बनाउनुहोस्।
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

      {!loading && requests.length > 0 && (
        <section className="mt-5 rounded-3xl border border-red-100 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-bold">Friend Requests</h2>
          <p className="mt-1 text-sm text-muted-foreground">तपाईंलाई आएको friend request यहाँबाट Accept वा Decline गर्नुहोस्।</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {requests.map((person) => (
              <div key={person.id} className="flex items-center gap-3 rounded-2xl border p-3">
                <div className="h-12 w-12 overflow-hidden rounded-full bg-muted">
                  {person.profilePhotoUrl ? <img src={profileMediaUrl(person.profilePhotoUrl) || ""} alt={person.name} className="h-full w-full object-cover" /> : <UserRound className="m-3 h-6 w-6 text-muted-foreground" />}
                </div>
                <div className="min-w-0 flex-1">
                  <button className="truncate font-bold hover:underline" onClick={() => router.push(`/profile/${person.id}`)}>{person.name}</button>
                  {person.location && <p className="truncate text-xs text-muted-foreground">{person.location}</p>}
                  <div className="mt-2 flex gap-2">
                    <Button size="sm" className="bg-red-600 hover:bg-red-700" disabled={friendBusy === person.id} onClick={async () => {
                      setFriendBusy(person.id);
                      try {
                        await privateApi.post(`/friend/accept/${person.id}`);
                        setRequests((current) => current.filter((row) => row.id !== person.id));
                        toast.success("Friend request accept भयो।");
                      } catch (error: any) {
                        toast.error(error?.response?.data?.message || "Request accept गर्न सकिएन।");
                      } finally { setFriendBusy(null); }
                    }}>Accept</Button>
                    <Button size="sm" variant="outline" disabled={friendBusy === person.id} onClick={async () => {
                      setFriendBusy(person.id);
                      try {
                        await privateApi.delete(`/friend/${person.id}`);
                        setRequests((current) => current.filter((row) => row.id !== person.id));
                        toast.success("Friend request decline भयो।");
                      } catch (error: any) {
                        toast.error(error?.response?.data?.message || "Request decline गर्न सकिएन।");
                      } finally { setFriendBusy(null); }
                    }}>Decline</Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {!loading && people.length > 0 && <h2 className="mt-6 text-lg font-bold">People You May Know</h2>}

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
                          <span className="truncate">{person.location}</span>
                        </p>
                      )}
                      {person.reason && (
                        <p className="mt-1 truncate text-xs font-semibold text-red-600">
                          {person.reason}
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

                <div className="mt-5 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => router.push(`/profile/${person.id}`)}
                  >
                    View Profile
                  </Button>
                  <Button
                    type="button"
                    disabled={friendBusy === person.id || ["FRIENDS", "REQUEST_SENT"].includes(friendStatus[person.id])}
                    className="gap-2 rounded-xl bg-red-600 text-white hover:bg-red-700"
                    onClick={async () => {
                      setFriendBusy(person.id);
                      try {
                        const response = await privateApi.post(`/friend/request/${person.id}`);
                        const status = String(response.data?.status || "REQUEST_SENT");
                        setFriendStatus((current) => ({ ...current, [person.id]: status }));
                        toast.success(status === "FRIENDS" ? "अब तपाईंहरू friends हुनुहुन्छ।" : "Friend request पठाइयो।");
                      } catch (error: any) {
                        toast.error(error?.response?.data?.message || "Friend request पठाउन सकिएन।");
                      } finally {
                        setFriendBusy(null);
                      }
                    }}
                  >
                    {friendBusy === person.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : friendStatus[person.id] === "FRIENDS" ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <UserPlus className="h-4 w-4" />
                    )}
                    {friendStatus[person.id] === "FRIENDS"
                      ? "Friends"
                      : friendStatus[person.id] === "REQUEST_SENT"
                        ? "Requested"
                        : friendStatus[person.id] === "REQUEST_RECEIVED"
                          ? "Accept"
                          : "Add Friend"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </main>
  );
}
