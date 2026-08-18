export const ROLES = [
  { label: "Ambassador", value: "Ambassador" },
  { label: "Assistant Director", value: "Assistant Director" },
  { label: "Captain", value: "Captain" },
  { label: "ELP", value: "ELP" },
  { label: "Executive Director", value: "Executive Director" },
  { label: "Finance Manager", value: "Finance Manager" },
  { label: "Fundraising Assistant Director", value: "Fundraising Assistant Director" },
  { label: "Marketing Manager", value: "Marketing Manager" },
  { label: "Membership Manager", value: "Membership Manager" },
  { label: "Miracle Maker", value: "Miracle Maker" },
  { label: "Operations Manager", value: "Operations Manager" },
  { label: "Overall", value: "Overall" },
];

// Roles that are only ever assignable by an admin editing the Firestore
// document directly (not selectable by users on sign-up/account-update).
const ADMIN_ONLY_ROLES = [
  "Overall",
  "Executive Director",
  "Fundraising Assistant Director",
  "Marketing Manager",
  "Finance Manager",
  "Membership Manager",
  "Operations Manager",
];

// Roles shown in the self-service sign-up / account-update dropdowns.
export const SELF_SERVICE_ROLES = ROLES.filter(
  (r) => !ADMIN_ONLY_ROLES.includes(r.value)
);

export const CAPTAIN_TEAMS = [
  { label: "N/A", value: "N/A" },
  { label: "Digital Marketing", value: "Digital Marketing" },
  { label: "Event Management", value: "Event Management" },
  { label: "Family Relations", value: "Family Relations" },
  { label: "Finance", value: "Finance" },
  { label: "Hospitality", value: "Hospitality" },
  { label: "Leadership Development", value: "Leadership Development" },
  { label: "Marathon Relations", value: "Marathon Relations" },
  { label: "Member Development", value: "Member Development" },
  { label: "Merchandise", value: "Merchandise" },
  { label: "Morale", value: "Morale" },
  { label: "Multimedia", value: "Multimedia" },
  { label: "Public Relations", value: "Public Relations" },
  { label: "Recruitment", value: "Recruitment" },
  { label: "Partnerships", value: "Partnerships" },
];

export const ALL_CAPTAIN_TEAM_NAMES = CAPTAIN_TEAMS.filter(
  (t) => t.value !== "N/A"
).map((t) => t.value);

// Roles that see a Team tab on the Fundraiser screen but only ever look at
// their own single captain team (no multi-team dropdown).
export const TEAM_TAB_SINGLE_ROLES = ["Overall", "Fundraising Assistant Director"];

// Roles that see a Team tab with a dropdown across multiple captain teams,
// and which captain teams each of those roles covers.
export const MANAGER_TEAM_GROUPS = {
  "Executive Director": ALL_CAPTAIN_TEAM_NAMES,
  "Marketing Manager": ["Digital Marketing", "Multimedia", "Public Relations"],
  "Finance Manager": [
    "Finance",
    "Marathon Relations",
    "Merchandise",
    "Partnerships",
  ],
  "Membership Manager": [
    "Leadership Development",
    "Member Development",
    "Recruitment",
  ],
  "Operations Manager": [
    "Event Management",
    "Family Relations",
    "Hospitality",
    "Morale",
  ],
};

export const SOCIAL_LINKS = [
  { key: "instagram", icon: "instagram", label: "Instagram", url: "https://www.instagram.com/floridadm/" },
  { key: "facebook", icon: "facebook", label: "Facebook", url: "https://www.facebook.com/FloridaDM/" },
  { key: "youtube", icon: "youtube-play", label: "YouTube", url: "https://www.youtube.com/user/DMatUF" },
  { key: "website", icon: "globe", label: "DM at UF Website", url: "https://floridadm.org" },
];

export const TECH_SUPPORT_EMAIL_URL = "mailto:technology@floridadm.org";
