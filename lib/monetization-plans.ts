export const MONETIZATION_PLANS = [
  { code: 'FREE', name: 'Free', fee: 0, validityDays: 30, activeListingLimit: 3, commissionRate: 10, priorityLevel: 0, featuredListings: 0, features: ['3 active room listings', 'Normal reach', 'Earning dashboard', 'Wallet & pending balance', 'Payment request support'] },
  { code: 'STARTER', name: 'Starter', fee: 299, validityDays: 30, activeListingLimit: 10, commissionRate: 9, priorityLevel: 1, featuredListings: 0, features: ['10 active room listings', 'Better reach', 'Listing analytics', 'Verified monetized badge eligibility', 'Photo/video listings', 'Payment release tracking'] },
  { code: 'BASIC', name: 'Basic', fee: 599, validityDays: 30, activeListingLimit: 25, commissionRate: 8, priorityLevel: 2, featuredListings: 1, features: ['25 active room listings', 'Priority reach', 'Detailed analytics', 'Profile promotion', 'Faster support', 'Lower commission'] },
  { code: 'PRO', name: 'Pro', fee: 899, validityDays: 30, activeListingLimit: 50, commissionRate: 7, priorityLevel: 3, featuredListings: 2, features: ['50 active room listings', 'Agent profile', 'Priority reach', 'Multiple-property management', 'Lead dashboard', 'Available/Rented management'] },
  { code: 'BUSINESS', name: 'Business', fee: 1299, validityDays: 30, activeListingLimit: 100, commissionRate: 5, priorityLevel: 4, featuredListings: 5, features: ['100 active room listings', 'Top priority reach', 'Business/agency profile', 'Team/agent tools', 'Advanced analytics', '5 featured listings'] },
] as const;

export type MonetizationPlanCode = (typeof MONETIZATION_PLANS)[number]['code'];
