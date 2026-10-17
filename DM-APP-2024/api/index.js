import AsyncStorage from "@react-native-async-storage/async-storage";
import { apiPaths } from "./api-paths";
import {
  IBadgesList,
  IDonationsList,
  IExtraLifeTeam,
  IExtraLifeUser,
  IIncentivesList,
  IMilestonesList,
  IRosterList,
} from "./interfaces";

export {
  IDonationsList,
  IExtraLifeTeam,
  IExtraLifeUser,
  IRosterList,
} from "./interfaces";

// DonorDrive's site sits behind bot/WAF protection that can reject bare
// requests with no browser-like signals. Sending realistic headers makes
// these look like a normal browser request instead of a raw HTTP client.
const DONORDRIVE_HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  Accept: "application/json, text/plain, */*",
  Referer: "https://events.dancemarathon.com/",
};

// DonorDrive's public API answers "429 Public API - Rate Limit Exceeded" when
// it gets too many requests too quickly. Every DonorDrive call goes through
// fetchDonorDriveJson below, which keeps the app under that limit by:
//   1. Queueing — at most MAX_CONCURRENT requests in flight, spaced at least
//      MIN_GAP_MS apart, no matter how many screens ask at once.
//   2. De-duping + a short cache — identical URLs requested at the same time
//      share one request, and a fresh response is reused for CACHE_TTL_MS.
//   3. A 429 circuit breaker — DonorDrive's limit is hourly (it sends
//      "Retry-After: 3600"), so waiting it out inside a request is pointless.
//      On a 429 every queued and new request fails fast, without touching the
//      network, until the Retry-After time passes. That also stops the app
//      from piling more traffic onto a limit it has already hit.
//   4. Stale-if-error — if a request fails (including while the breaker is
//      open), the last good response for that URL is returned instead of an
//      error, so screens keep showing real numbers rather than blanks or $0.
//      Good responses are also saved on the phone (AsyncStorage), so this
//      still works right after the app is closed and reopened during a block.
const MAX_CONCURRENT = 2;
const MIN_GAP_MS = 250;
const CACHE_TTL_MS = 20 * 1000;
const RATE_LIMIT_COOLDOWN_MS = 60 * 1000; // used when no Retry-After is sent
const MAX_COOLDOWN_MS = 60 * 60 * 1000;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const rateLimitError = () => {
  const error = new Error("DonorDrive rate limit exceeded (429)");
  error.rateLimited = true;
  return error;
};

let inFlight = 0;
let lastStart = 0;
let blockedUntil = 0;
let pumpTimer = null;
const queue = [];

const pump = () => {
  if (queue.length === 0) return;
  if (blockedUntil > Date.now()) {
    while (queue.length > 0) queue.shift().cancel(rateLimitError());
    return;
  }
  if (pumpTimer || inFlight >= MAX_CONCURRENT) return;
  const now = Date.now();
  const wait = lastStart + MIN_GAP_MS - now;
  if (wait > 0) {
    pumpTimer = setTimeout(() => {
      pumpTimer = null;
      pump();
    }, wait);
    return;
  }
  const job = queue.shift();
  inFlight++;
  lastStart = now;
  job.run().finally(() => {
    inFlight--;
    pump();
  });
  pump();
};

const schedule = (job) =>
  new Promise((resolve, reject) => {
    queue.push({ run: () => job().then(resolve, reject), cancel: reject });
    pump();
  });

const requestOnce = async (url) => {
  const res = await fetch(url, { headers: DONORDRIVE_HEADERS });
  const text = await res.text();
  return { res, text };
};

// Resolves to { res, text } where text is known to be valid JSON.
const loadFromDonorDrive = async (url, retries, delayMs) => {
  let lastError;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const { res, text } = await schedule(() => requestOnce(url));

      if (res.status === 429) {
        const retryAfter = res.headers.get("retry-after");
        const retryAfterSec = parseInt(retryAfter, 10);
        const cooldown = Math.min(
          Number.isFinite(retryAfterSec)
            ? retryAfterSec * 1000
            : RATE_LIMIT_COOLDOWN_MS,
          MAX_COOLDOWN_MS
        );
        // Open the breaker (queued requests are cancelled by pump()).
        blockedUntil = Math.max(blockedUntil, Date.now() + cooldown);
        console.log(
          `[DonorDrive] 429 rate limited (retry-after: ${retryAfter}) — blocking DonorDrive requests for ${Math.round(cooldown / 1000)}s :: ${url}`
        );
        throw rateLimitError();
      }

      try {
        JSON.parse(text);
        return { res, text };
      } catch (parseError) {
        lastError = parseError;
        console.log(
          `[DonorDrive] non-JSON response (attempt ${attempt + 1}) ${res.status} ${url} :: ${text.slice(0, 160).replace(/\s+/g, " ")}`
        );
      }
    } catch (fetchError) {
      // Never retry into a rate limit.
      if (fetchError.rateLimited) throw fetchError;
      lastError = fetchError;
    }
    if (attempt < retries) await sleep(delayMs);
  }
  throw lastError;
};

// --- Last good responses, saved on the phone ------------------------------
// Only ever used as a fallback when a request fails or the 429 breaker is
// open; a working request always wins. Best-effort: any storage error is
// ignored so it can never break a screen. The data is DonorDrive's public
// participant/team info, so it isn't tied to a signed-in user.
const STORE_PREFIX = "dd:v1:";
const STORE_INDEX_KEY = `${STORE_PREFIX}index`;
const MAX_STORED_ENTRIES = 120; // oldest are dropped past this (Android's AsyncStorage caps ~6MB total)
const MAX_STORED_CHARS = 200 * 1000; // skip unusually large responses
const MAX_STORED_AGE_MS = 3 * 24 * 60 * 60 * 1000; // don't show numbers older than this

let storeIndex = null; // Map<url, savedAtMs>, loaded lazily
let storeIndexLoading = null;
let storeIndexTimer = null;

const loadStoreIndex = () => {
  if (storeIndex) return Promise.resolve(storeIndex);
  if (!storeIndexLoading) {
    storeIndexLoading = AsyncStorage.getItem(STORE_INDEX_KEY)
      .then((raw) => {
        storeIndex = new Map(Object.entries(raw ? JSON.parse(raw) : {}));
        return storeIndex;
      })
      .catch(() => {
        storeIndex = new Map();
        return storeIndex;
      });
  }
  return storeIndexLoading;
};

const scheduleStoreIndexWrite = () => {
  if (storeIndexTimer) return;
  storeIndexTimer = setTimeout(() => {
    storeIndexTimer = null;
    AsyncStorage.setItem(
      STORE_INDEX_KEY,
      JSON.stringify(Object.fromEntries(storeIndex))
    ).catch(() => {});
  }, 2000);
};

const saveToPhone = async (url, { res, text }) => {
  if (text.length > MAX_STORED_CHARS) return;
  try {
    const index = await loadStoreIndex();
    const savedAt = Date.now();
    await AsyncStorage.setItem(
      STORE_PREFIX + url,
      JSON.stringify({ at: savedAt, text, numRecords: res.headers.get("num-records") })
    );
    index.set(url, savedAt);
    if (index.size > MAX_STORED_ENTRIES) {
      // Drop the oldest, plus a little extra so this doesn't run on every save.
      const oldest = [...index.entries()]
        .sort((a, b) => a[1] - b[1])
        .slice(0, index.size - MAX_STORED_ENTRIES + 20);
      oldest.forEach(([key]) => index.delete(key));
      await AsyncStorage.multiRemove(oldest.map(([key]) => STORE_PREFIX + key));
    }
    scheduleStoreIndexWrite();
  } catch (e) {
    // Saving is best-effort.
  }
};

// Resolves to { res, text } shaped like a network result (callers only read
// the num-records header), or null if nothing usable is saved for this URL.
const loadFromPhone = async (url) => {
  try {
    const raw = await AsyncStorage.getItem(STORE_PREFIX + url);
    if (!raw) return null;
    const saved = JSON.parse(raw);
    if (
      !saved ||
      typeof saved.text !== "string" ||
      Date.now() - saved.at > MAX_STORED_AGE_MS
    ) {
      return null;
    }
    JSON.parse(saved.text); // make sure it's still valid JSON
    return {
      res: {
        status: 200,
        headers: {
          get: (name) =>
            String(name).toLowerCase() === "num-records"
              ? saved.numRecords ?? null
              : null,
        },
      },
      text: saved.text,
    };
  } catch (e) {
    return null;
  }
};

// Bumped every time a saved/older response is returned instead of a fresh one,
// so screens can tell "these numbers are from an earlier update" apart from
// "these numbers are current" (compare the count before and after a load).
let staleServed = 0;
export const getDonorDriveStaleCount = () => staleServed;

const cache = new Map(); // url -> { at, res, text }
const pending = new Map(); // url -> Promise<{ res, text }>

export const fetchDonorDriveJson = async (url, retries = 2, delayMs = 600) => {
  const cached = cache.get(url);
  // Parse from the stored text on every hit so callers that mutate the
  // returned JSON (e.g. prefixing avatar URLs) can't corrupt the cache.
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return { res: cached.res, json: JSON.parse(cached.text) };
  }

  let request = pending.get(url);
  if (!request) {
    request = loadFromDonorDrive(url, retries, delayMs)
      .then((result) => {
        cache.set(url, { at: Date.now(), ...result });
        saveToPhone(url, result);
        return result;
      })
      .finally(() => pending.delete(url));
    pending.set(url, request);
  }

  try {
    const { res, text } = await request;
    return { res, json: JSON.parse(text) };
  } catch (error) {
    if (cached) {
      staleServed++;
      console.log(`[DonorDrive] request failed — using last good response :: ${url}`);
      return { res: cached.res, json: JSON.parse(cached.text) };
    }
    const saved = await loadFromPhone(url);
    if (saved) {
      staleServed++;
      console.log(`[DonorDrive] request failed — using response saved on the phone :: ${url}`);
      return { res: saved.res, json: JSON.parse(saved.text) };
    }
    throw error;
  }
};

// Participant lookups with no ID (e.g. App.jsx calls getUserInfo on startup
// before the user's donorID has loaded) would request "/api/participants/" —
// a pointless call that still counts against DonorDrive's rate limit.
const missingId = (id) => id === undefined || id === null || id === "";

// For the Refresh buttons: marks every cached response stale so the next
// request goes to DonorDrive instead of the 20s cache. The old responses are
// kept, so if that request fails they're still used as the last-good fallback.
export const invalidateDonorDriveCache = () => {
  cache.forEach((entry) => {
    entry.at = 0;
  });
};

// Timestamp (ms) when DonorDrive's rate-limit block ends, or 0 if not blocked.
export const getDonorDriveBlockedUntil = () =>
  blockedUntil > Date.now() ? blockedUntil : 0;

export const getUserInfo = async (id) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    // const url = apiPaths.profileUrl(Number(id));
    const url = apiPaths.profileUrl(id);
    let userInfoJson = {};

    fetchDonorDriveJson(url)
      .then(({ json: payload }) => {
        try {
          userInfoJson =
            payload && typeof payload === "object" && !Array.isArray(payload)
              ? payload
              : {};

          userInfoJson.avatarImageURL = userInfoJson.avatarImageURL || "";
          userInfoJson.donateURL = `https://events.dancemarathon.com/index.cfm?fuseaction=donordrive.participant&participantID=${id}`;

          // Note: this used to also fetch the team's teamURL via a second
          // getTeamInfo() request whenever teamID was present. Nothing in the
          // app reads userInfoJson.teamURL, so that request was pure extra
          // load on DonorDrive's rate-limited API for no benefit — removed.
          resolve(userInfoJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch((error) => {
        console.error("Fetch Error:", error);
        reject("There was an error trying to make your request");
      });
  });
};

export const getUserDonations = async (id, limit = 100, page = 1) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    const url = apiPaths.userDonationUrl(id, limit, page);
    const userDonationsJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          userDonationsJson.countDonations =
            parseInt(res.headers.get("num-records"), 10) || 0;
          userDonationsJson.countPages = Math.ceil(
            userDonationsJson.countDonations / limit
          );
          userDonationsJson.donations = json;
          resolve(userDonationsJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log("Error parsing userDonations URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getUserMilestones = async (id, limit = 100, page = 1) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    const url = apiPaths.userMilestonesUrl(id, limit, page);
    const userMilestonesJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          userMilestonesJson.countMilestones =
            parseInt(res.headers.get("num-records"), 10) || 0;
          userMilestonesJson.countPages = Math.ceil(
            userMilestonesJson.countMilestones / limit
          );
          userMilestonesJson.milestones = json;
          resolve(userMilestonesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log("Error parsing userMilestones URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getUserIncentives = async (id, limit = 100, page = 1) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    const url = apiPaths.userIncentivesUrl(id, limit, page);
    const userIncentivesJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          userIncentivesJson.countIncentives =
            parseInt(res.headers.get("num-records"), 10) || 0;
          userIncentivesJson.countPages = Math.ceil(
            userIncentivesJson.countIncentives / limit
          );
          userIncentivesJson.incentives = json;
          resolve(userIncentivesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log("Error parsing userIncentives URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getUserBadges = async (id, limit = 100, page = 1) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    const url = apiPaths.userBadgesUrl(id, limit, page);
    const userBadgesJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          userBadgesJson.countBadges =
            parseInt(res.headers.get("num-records"), 10) || 0;
          userBadgesJson.countPages = Math.ceil(
            userBadgesJson.countBadges / limit
          );
          userBadgesJson.badges = json;
          resolve(userBadgesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log("Error parsing userBadges URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getTeamInfo = async (id, fetchRoster = true) => {
  return new Promise((resolve, reject) => {
    const url = apiPaths.teamProfileUrl(id);
    let teamInfoJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ json }) => {
        try {
          teamInfoJson = json;
        } catch (e) {
          reject(e);
        }
        teamInfoJson.avatarImageURL = "http:" + teamInfoJson.avatarImageURL;
        if (fetchRoster) {
          getTeamRoster(id)
            .then((rosterData) => {
              teamInfoJson.members = rosterData.members.map((u) => {
                u.URL = `https://events.dancemarathon.com/index.cfm?fuseaction=donordrive.team&teamID=${u.participantID}`;
                return u;
              });

              resolve(teamInfoJson);
            })
            .catch((reason) => {
              reject(reason);
            });
        } else {
          resolve(teamInfoJson);
        }
      })
      .catch(() => {
        console.log("Error obtaining team info");
        reject("There was an error trying to make your request");
      });
  });
};

export const getTeamDonations = async (id, limit = 100, page = 1) => {
  return new Promise((resolve, reject) => {
    const teamDonationsJson = {};
    const url = apiPaths.teamDonationsUrl(id, limit, page);

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          teamDonationsJson.countDonations =
            parseInt(res.headers.get("num-records"), 10) || 0;
          teamDonationsJson.countPages = Math.ceil(
            teamDonationsJson.countDonations / limit
          );
          teamDonationsJson.donations = json;
        } catch (e) {
          reject(e);
        }

        resolve(teamDonationsJson);
      })
      .catch(() => {
        console.log("Error parsing teamDonations URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getTeamRoster = async (id, page) => {
  return new Promise((resolve, reject) => {
    const teamRosterJson = {};
    const offsetCalc = page && page !== 1 ? (page - 1) * 100 : null;
    const url = apiPaths.teamRosterUrl(id, offsetCalc);

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          teamRosterJson.countMembers =
            parseInt(res.headers.get("num-records"), 10) || 0;
          teamRosterJson.countPages = Math.ceil(
            teamRosterJson.countMembers / 100
          );
          teamRosterJson.members = json;
        } catch (e) {
          reject(e);
        }

        if (!teamRosterJson.members) {
          teamRosterJson.members = [];
        }

        teamRosterJson.members.forEach((member) => {
          member.avatarImageURL = "https:" + member.avatarImageURL;
        });

        resolve(teamRosterJson);
      })
      .catch(() => {
        console.log("Error parsing teamRoster URL");
        reject("There was an error trying to make your request");
      });
  });
};

export const getUserActivity = async (id, limit = 100, page = 1) => {
  if (missingId(id)) return Promise.reject("Missing DonorDrive participant ID");
  return new Promise((resolve, reject) => {
    const url = apiPaths.userActivityUrl(id, limit, page);
    const userActivityJson = {};

    fetchDonorDriveJson(url)
      .then(async ({ res, json }) => {
        try {
          userActivityJson.countActivity =
            parseInt(res.headers.get("num-records"), 10) || 0;
          userActivityJson.countPages = Math.ceil(
            userActivityJson.countActivity / limit
          );
          userActivityJson.activities = json;
          resolve(userActivityJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log("Error parsing userActivity URL");
        reject("There was an error trying to make your request");
      });
  });
};

//module.exports = { getUserInfo, getUserDonations, getUserMilestones, getUserIncentives, getUserBadges, getTeamInfo, getTeamDonations, getTeamRoster };
