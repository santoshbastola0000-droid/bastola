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


export type CitySeoLanding = {
  slug: string;
  name: string;
  province: string;
  roomDescription: string;
  jobDescription: string;
  roomSearchHref: string;
  jobSearchHref: string;
};

export const NEPAL_CITIES: CitySeoLanding[] = [
  { slug: "kathmandu", name: "Kathmandu", province: "Bagmati Province", roomDescription: "Search rooms, flats, apartments and houses for rent in Kathmandu by location, property type and monthly budget.", jobDescription: "Search current job vacancies in Kathmandu across hospitality, retail, office, sales, driving and other roles.", roomSearchHref: "/rooms?q=Kathmandu", jobSearchHref: "/jobs?location=Kathmandu" },
  { slug: "lalitpur", name: "Lalitpur", province: "Bagmati Province", roomDescription: "Find rental rooms, flats and houses in Lalitpur and compare options by area, property type and budget.", jobDescription: "Find job vacancies in Lalitpur across hospitality, retail, office, sales and other categories.", roomSearchHref: "/rooms?q=Lalitpur", jobSearchHref: "/jobs?location=Lalitpur" },
  { slug: "bhaktapur", name: "Bhaktapur", province: "Bagmati Province", roomDescription: "Browse rental rooms, flats and houses in Bhaktapur with RoomKhoj search and filters.", jobDescription: "Browse job vacancies in Bhaktapur and search by role and current availability.", roomSearchHref: "/rooms?q=Bhaktapur", jobSearchHref: "/jobs?location=Bhaktapur" },
  { slug: "pokhara", name: "Pokhara", province: "Gandaki Province", roomDescription: "Find rooms, flats, apartments and houses for rent in Pokhara by area, monthly rent and property type.", jobDescription: "Search job vacancies in Pokhara for hospitality, restaurants, retail, office, driving and other roles.", roomSearchHref: "/rooms?q=Pokhara", jobSearchHref: "/jobs?location=Pokhara" },
  { slug: "bharatpur", name: "Bharatpur", province: "Bagmati Province", roomDescription: "Search rental rooms, flats and houses in Bharatpur and compare available options by budget and property type.", jobDescription: "Search job vacancies in Bharatpur across hospitality, retail, office, sales, healthcare support and other roles.", roomSearchHref: "/rooms?q=Bharatpur", jobSearchHref: "/jobs?location=Bharatpur" },
  { slug: "biratnagar", name: "Biratnagar", province: "Koshi Province", roomDescription: "Browse rooms, flats and houses for rent in Biratnagar using location and budget-based search.", jobDescription: "Find job vacancies in Biratnagar across industry, retail, office, sales, hospitality and other sectors.", roomSearchHref: "/rooms?q=Biratnagar", jobSearchHref: "/jobs?location=Biratnagar" },
  { slug: "birgunj", name: "Birgunj", province: "Madhesh Province", roomDescription: "Find rental rooms, flats and houses in Birgunj with RoomKhoj.", jobDescription: "Search current job vacancies in Birgunj by role and location.", roomSearchHref: "/rooms?q=Birgunj", jobSearchHref: "/jobs?location=Birgunj" },
  { slug: "dharan", name: "Dharan", province: "Koshi Province", roomDescription: "Search rooms, flats and houses for rent in Dharan by location, type and budget.", jobDescription: "Search job vacancies in Dharan across hospitality, retail, office, sales and other roles.", roomSearchHref: "/rooms?q=Dharan", jobSearchHref: "/jobs?location=Dharan" },
  { slug: "itahari", name: "Itahari", province: "Koshi Province", roomDescription: "Browse rental rooms and flats in Itahari and search by monthly budget and property type.", jobDescription: "Browse job vacancies in Itahari and search by role and location.", roomSearchHref: "/rooms?q=Itahari", jobSearchHref: "/jobs?location=Itahari" },
  { slug: "hetauda", name: "Hetauda", province: "Bagmati Province", roomDescription: "Find rooms, flats and houses for rent in Hetauda with RoomKhoj.", jobDescription: "Find job vacancies in Hetauda across office, retail, hospitality, sales and other categories.", roomSearchHref: "/rooms?q=Hetauda", jobSearchHref: "/jobs?location=Hetauda" },
  { slug: "butwal", name: "Butwal", province: "Lumbini Province", roomDescription: "Search rental rooms, flats and houses in Butwal by area, property type and monthly budget.", jobDescription: "Search job vacancies in Butwal across hospitality, retail, office, sales, driving and other roles.", roomSearchHref: "/rooms?q=Butwal", jobSearchHref: "/jobs?location=Butwal" },
  { slug: "nepalgunj", name: "Nepalgunj", province: "Lumbini Province", roomDescription: "Browse rooms, flats and houses for rent in Nepalgunj using RoomKhoj.", jobDescription: "Browse job vacancies in Nepalgunj and search by role and location.", roomSearchHref: "/rooms?q=Nepalgunj", jobSearchHref: "/jobs?location=Nepalgunj" },
  { slug: "tulsipur", name: "Tulsipur", province: "Lumbini Province", roomDescription: "Find rental rooms, flats and houses in Tulsipur by budget and property type.", jobDescription: "Search job vacancies in Tulsipur across retail, office, hospitality and other roles.", roomSearchHref: "/rooms?q=Tulsipur", jobSearchHref: "/jobs?location=Tulsipur" },
  { slug: "ghorahi", name: "Ghorahi", province: "Lumbini Province", roomDescription: "Search rooms, flats and houses for rent in Ghorahi with RoomKhoj.", jobDescription: "Search job vacancies in Ghorahi by role and location.", roomSearchHref: "/rooms?q=Ghorahi", jobSearchHref: "/jobs?location=Ghorahi" },
  { slug: "dhangadhi", name: "Dhangadhi", province: "Sudurpashchim Province", roomDescription: "Browse rental rooms, flats and houses in Dhangadhi by location and monthly budget.", jobDescription: "Find job vacancies in Dhangadhi across retail, office, hospitality, sales and other roles.", roomSearchHref: "/rooms?q=Dhangadhi", jobSearchHref: "/jobs?location=Dhangadhi" },
  { slug: "janakpur", name: "Janakpur", province: "Madhesh Province", roomDescription: "Find rooms, flats and houses for rent in Janakpur with RoomKhoj.", jobDescription: "Search job vacancies in Janakpur by role and location.", roomSearchHref: "/rooms?q=Janakpur", jobSearchHref: "/jobs?location=Janakpur" },
  { slug: "damak", name: "Damak", province: "Koshi Province", roomDescription: "Search rental rooms, flats and houses in Damak by property type and budget.", jobDescription: "Browse job vacancies in Damak by role and location.", roomSearchHref: "/rooms?q=Damak", jobSearchHref: "/jobs?location=Damak" },
  { slug: "birtamod", name: "Birtamod", province: "Koshi Province", roomDescription: "Find rental rooms, flats and houses in Birtamod with RoomKhoj.", jobDescription: "Search job vacancies in Birtamod by role and location.", roomSearchHref: "/rooms?q=Birtamod", jobSearchHref: "/jobs?location=Birtamod" },
];

export function getNepalCity(slug: string) {
  return NEPAL_CITIES.find((city) => city.slug === slug) || null;
}


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
