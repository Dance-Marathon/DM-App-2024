// The only place the current DM year is defined — bump this each year
// instead of rewriting role values in Firestore. Only ELP and Ambassador are
// year-suffixed roles right now (see ROLES below); a future year/role system
// can replace just this file without touching anywhere ROLES or
// displayRole() are used.
export const CURRENT_DM_YEAR = "DM27";

// Strips a trailing " DM##" (any two digits) from a role for display, e.g.
// "ELP DM27" -> "ELP". Generic on purpose — not an ELP/Ambassador special
// case — so it keeps working if more roles pick up a year suffix later, and
// is a no-op for roles that never had one.
export const displayRole = (role) =>
  typeof role === "string" ? role.replace(/\s+DM\d{2}$/, "") : role;

// This year's exact role values — only users with EXACTLY these values count
// as this year's ELP/Ambassador groups (3b). Last year's plain "ELP" /
// "Ambassador" holders are intentionally excluded.
export const ELP_ROLE = `ELP ${CURRENT_DM_YEAR}`;
export const AMBASSADOR_ROLE = `Ambassador ${CURRENT_DM_YEAR}`;

export const ROLES = [
  { label: `Ambassador ${CURRENT_DM_YEAR}`, value: `Ambassador ${CURRENT_DM_YEAR}` },
  { label: "App Admin", value: "App Admin" },
  { label: "Assistant Director", value: "Assistant Director" },
  { label: "Captain", value: "Captain" },
  { label: `ELP ${CURRENT_DM_YEAR}`, value: `ELP ${CURRENT_DM_YEAR}` },
  { label: "Executive Director", value: "Executive Director" },
  { label: "Finance Manager", value: "Finance Manager" },
  { label: "Marketing Manager", value: "Marketing Manager" },
  { label: "Membership Manager", value: "Membership Manager" },
  { label: "Miracle Maker", value: "Miracle Maker" },
  { label: "Operations Manager", value: "Operations Manager" },
  { label: "Overall", value: "Overall" },
];

// Roles that are only ever assignable by an admin editing the Firestore
// document directly (not selectable by users on sign-up/account-update).
// App Admin in particular must never be self-selectable — it's a
// testing/verification role with full fundraising visibility.
const ADMIN_ONLY_ROLES = [
  "Overall",
  "App Admin",
  "Executive Director",
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
  { label: "Sponsorships", value: "Sponsorships" },
];

export const ALL_CAPTAIN_TEAM_NAMES = CAPTAIN_TEAMS.filter(
  (t) => t.value !== "N/A"
).map((t) => t.value);

// Roles that see a Team tab on the Fundraiser screen built around their own
// single captain team — plain Overall/Assistant Director see only that team;
// if their captainTeam is Leadership Development or Member Development
// (see LD_MD_BONUS_TEAM below), they get a 2-option dropdown adding
// ELP/Ambassador fundraising alongside it.
export const TEAM_TAB_SINGLE_ROLES = ["Overall", "Assistant Director"];

// Roles that see a Team tab with a dropdown across multiple captain teams,
// and which captain teams (plus, for some roles, the ELP/Ambassador pseudo-
// teams) each of those roles covers. "ELP"/"Ambassador" here are not real
// captain teams — they're matched by role instead of captainTeam, see
// getTeamOptionsFor() below.
export const MANAGER_TEAM_GROUPS = {
  "Executive Director": [...ALL_CAPTAIN_TEAM_NAMES, "ELP", "Ambassador"],
  "App Admin": [...ALL_CAPTAIN_TEAM_NAMES, "ELP", "Ambassador"],
  "Marketing Manager": ["Digital Marketing", "Multimedia", "Public Relations"],
  "Finance Manager": [
    "Finance",
    "Marathon Relations",
    "Merchandise",
    "Sponsorships",
  ],
  "Membership Manager": [
    "Leadership Development",
    "Member Development",
    "Recruitment",
    "ELP",
    "Ambassador",
  ],
  "Operations Manager": [
    "Event Management",
    "Family Relations",
    "Hospitality",
    "Morale",
  ],
};

// A captainTeam of Leadership Development/Member Development earns its
// Overall/Assistant Director/Captain the matching ELP/Ambassador fundraising
// access alongside (Overall/AD) or instead of (Captain) their own team.
export const LD_MD_BONUS_TEAM = {
  "Leadership Development": "ELP",
  "Member Development": "Ambassador",
};

// Maps the pseudo-team values used above ("ELP"/"Ambassador") to the exact
// role value FundraiserTeam should query by instead of captainTeam.
export const PSEUDO_TEAM_ROLE_VALUE = {
  ELP: ELP_ROLE,
  Ambassador: AMBASSADOR_ROLE,
};

// Resolves the list of "team" values (real captain team names, or the
// pseudo-values "ELP"/"Ambassador") a given role+captainTeam combination may
// view on the Fundraiser screen's Team tab. Empty array means no Team tab.
export const getTeamOptionsFor = (role, captainTeam) => {
  if (MANAGER_TEAM_GROUPS[role]) return MANAGER_TEAM_GROUPS[role];

  const bonusTeam = LD_MD_BONUS_TEAM[captainTeam];

  // Captains normally can't see their own captain team's fundraising at
  // all — but LD/MD captains see ELP/Ambassador fundraising instead.
  if (role === "Captain") return bonusTeam ? [bonusTeam] : [];

  if (TEAM_TAB_SINGLE_ROLES.includes(role)) {
    return bonusTeam ? [captainTeam, bonusTeam] : [captainTeam];
  }

  return [];
};

// Roles (beyond anyone who's a captain on a team) allowed to see the
// captain-team spirit points leaderboard.
export const CAPTAIN_LEADERBOARD_ROLES = [
  "Assistant Director",
  "App Admin",
  "Marketing Manager",
  "Membership Manager",
  "Operations Manager",
  "Finance Manager",
  "Overall",
  "Executive Director",
];

export const SOCIAL_LINKS = [
  { key: "instagram", icon: "instagram", label: "Instagram", url: "https://www.instagram.com/floridadm/" },
  { key: "facebook", icon: "facebook", label: "Facebook", url: "https://www.facebook.com/FloridaDM/" },
  { key: "youtube", icon: "youtube-play", label: "YouTube", url: "https://www.youtube.com/user/DMatUF" },
  { key: "website", icon: "globe", label: "DM at UF Website", url: "https://floridadm.org" },
];

export const TECH_SUPPORT_EMAIL_URL = "mailto:technology@floridadm.org";
