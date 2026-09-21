export type RoomSeoLanding = {
  slug: string;
  label: string;
  kind: "area" | "budget";
  title: string;
  description: string;
  searchHref: string;
};

export type JobSeoLanding = {
  slug: string;
  title: string;
  description: string;
  searchTerm: string;
};

export const POKHARA_ROOM_LANDINGS: RoomSeoLanding[] = [
  {
    slug: "lakeside",
    label: "Lakeside",
    kind: "area",
    title: "Room for Rent in Lakeside, Pokhara",
    description:
      "Browse rooms, flats and apartments around Lakeside, Pokhara. Compare monthly rent, room type and facilities on RoomKhoj.",
    searchHref: "/rooms?q=Lakeside%20Pokhara",
  },
  {
    slug: "new-road",
    label: "New Road",
    kind: "area",
    title: "Room for Rent in New Road, Pokhara",
    description:
      "Find rental rooms and flats around New Road, Pokhara with searchable price and property filters.",
    searchHref: "/rooms?q=New%20Road%20Pokhara",
  },
  {
    slug: "chipledhunga",
    label: "Chipledhunga",
    kind: "area",
    title: "Room for Rent in Chipledhunga, Pokhara",
    description:
      "Explore available rooms and rental properties around Chipledhunga, Pokhara on RoomKhoj.",
    searchHref: "/rooms?q=Chipledhunga%20Pokhara",
  },
  {
    slug: "mahendrapul",
    label: "Mahendrapul",
    kind: "area",
    title: "Room for Rent in Mahendrapul, Pokhara",
    description:
      "Search rooms, flats and houses around Mahendrapul, Pokhara and compare rental options.",
    searchHref: "/rooms?q=Mahendrapul%20Pokhara",
  },
  {
    slug: "prithvi-chowk",
    label: "Prithvi Chowk",
    kind: "area",
    title: "Room for Rent near Prithvi Chowk, Pokhara",
    description:
      "Find rental rooms and flats near Prithvi Chowk, Pokhara with RoomKhoj search filters.",
    searchHref: "/rooms?q=Prithvi%20Chowk%20Pokhara",
  },
  {
    slug: "bagar",
    label: "Bagar",
    kind: "area",
    title: "Room for Rent in Bagar, Pokhara",
    description:
      "Browse rental rooms and flats around Bagar, Pokhara and compare available listings.",
    searchHref: "/rooms?q=Bagar%20Pokhara",
  },
  {
    slug: "birauta",
    label: "Birauta",
    kind: "area",
    title: "Room for Rent in Birauta, Pokhara",
    description:
      "Search rooms, flats and houses around Birauta, Pokhara using RoomKhoj.",
    searchHref: "/rooms?q=Birauta%20Pokhara",
  },
  {
    slug: "nadipur",
    label: "Nadipur",
    kind: "area",
    title: "Room for Rent in Nadipur, Pokhara",
    description:
      "Find rental rooms and flats around Nadipur, Pokhara and browse current options on RoomKhoj.",
    searchHref: "/rooms?q=Nadipur%20Pokhara",
  },
  {
    slug: "under-10000",
    label: "Under Rs. 10,000",
    kind: "budget",
    title: "Rooms in Pokhara Under Rs. 10,000",
    description:
      "Search Pokhara rental rooms with a monthly budget up to Rs. 10,000.",
    searchHref: "/rooms?q=Pokhara&max=10000",
  },
  {
    slug: "under-15000",
    label: "Under Rs. 15,000",
    kind: "budget",
    title: "Rooms in Pokhara Under Rs. 15,000",
    description:
      "Browse rooms and flats in Pokhara with a monthly budget up to Rs. 15,000.",
    searchHref: "/rooms?q=Pokhara&max=15000",
  },
  {
    slug: "under-20000",
    label: "Under Rs. 20,000",
    kind: "budget",
    title: "Rooms in Pokhara Under Rs. 20,000",
    description:
      "Explore Pokhara rental properties with a monthly budget up to Rs. 20,000.",
    searchHref: "/rooms?q=Pokhara&max=20000",
  },
];

export const POKHARA_JOB_ROLES: JobSeoLanding[] = [
  {
    slug: "waiter",
    title: "Waiter",
    description: "Find waiter job vacancies in Pokhara restaurants, cafes and hotels.",
    searchTerm: "Waiter",
  },
  {
    slug: "cook",
    title: "Cook",
    description: "Find cook and kitchen job vacancies in Pokhara.",
    searchTerm: "Cook",
  },
  {
    slug: "barista",
    title: "Barista",
    description: "Find barista and cafe job vacancies in Pokhara.",
    searchTerm: "Barista",
  },
  {
    slug: "receptionist",
    title: "Receptionist",
    description: "Find receptionist and front-desk job vacancies in Pokhara.",
    searchTerm: "Receptionist",
  },
  {
    slug: "sales",
    title: "Sales",
    description: "Find sales and marketing job vacancies in Pokhara.",
    searchTerm: "Sales",
  },
  {
    slug: "hotel",
    title: "Hotel",
    description: "Find hotel and hospitality job vacancies in Pokhara.",
    searchTerm: "Hotel",
  },
  {
    slug: "driver",
    title: "Driver",
    description: "Find driver and delivery job vacancies in Pokhara.",
    searchTerm: "Driver",
  },
  {
    slug: "caregiver",
    title: "Caregiver",
    description: "Find caregiver and support job vacancies in Pokhara.",
    searchTerm: "Caregiver",
  },
];

export function getPokharaRoomLanding(slug: string) {
  return POKHARA_ROOM_LANDINGS.find((item) => item.slug === slug) || null;
}

export function getPokharaJobRole(slug: string) {
  return POKHARA_JOB_ROLES.find((item) => item.slug === slug) || null;
}
