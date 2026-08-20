export type CandidateCategory = {
  key: string;
  label: string;
  roles: string[];
};

export const candidateCategories: CandidateCategory[] = [
  {
    key: "HOTEL_HOSPITALITY",
    label: "Hotel & Hospitality",
    roles: [
      "Waiter",
      "Cook",
      "Chef",
      "Barista",
      "Receptionist",
      "Housekeeping",
      "Kitchen Helper",
      "Other / Not listed",
    ],
  },
  {
    key: "SALES_MARKETING",
    label: "Sales & Marketing",
    roles: [
      "Sales Assistant",
      "Sales Executive",
      "Marketing Assistant",
      "Promoter",
      "Customer Service",
      "Other / Not listed",
    ],
  },
  {
    key: "OFFICE_ADMIN",
    label: "Office & Admin",
    roles: [
      "Office Assistant",
      "Receptionist",
      "Accountant",
      "Data Entry",
      "Computer Operator",
      "Other / Not listed",
    ],
  },
  {
    key: "DRIVER_DELIVERY",
    label: "Driver & Delivery",
    roles: [
      "Driver",
      "Delivery Rider",
      "Courier",
      "Helper",
      "Other / Not listed",
    ],
  },
  {
    key: "TECHNICAL_SKILLED",
    label: "Technical / Skilled",
    roles: [
      "Electrician",
      "Plumber",
      "Mechanic",
      "Technician",
      "Carpenter",
      "Painter",
      "Other / Not listed",
    ],
  },
  {
    key: "IT_COMPUTER",
    label: "IT & Computer",
    roles: [
      "Computer Operator",
      "IT Support",
      "Web Developer",
      "Graphic Designer",
      "Data Entry",
      "Other / Not listed",
    ],
  },
  {
    key: "EDUCATION",
    label: "Education & Teaching",
    roles: [
      "Teacher",
      "Tutor",
      "Montessori Teacher",
      "Trainer",
      "Other / Not listed",
    ],
  },
  {
    key: "CARE_SUPPORT",
    label: "Care & Support",
    roles: [
      "Caregiver",
      "Nanny",
      "Home Support",
      "Health Assistant",
      "Other / Not listed",
    ],
  },
  {
    key: "SECURITY",
    label: "Security",
    roles: [
      "Security Guard",
      "Supervisor",
      "Other / Not listed",
    ],
  },
  {
    key: "OTHER",
    label: "Other / Not listed",
    roles: [
      "Other / Not listed",
    ],
  },
];

export function getRolesForCategory(category: string) {
  return (
    candidateCategories.find(
      (item) => item.key === category,
    )?.roles || []
  );
}
