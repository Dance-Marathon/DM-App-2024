import React, { createContext, useContext, useEffect, useState, useMemo } from "react";
import { doc, onSnapshot, collection, getDocs } from "firebase/firestore";
import { db } from "./Firebase/AuthManager";

const ColorTeamsContext = createContext({
  colorTeamsEnabled: false,
  teamsLoaded: false,
  teams: [],
  getTeamForOrg: () => null,
});

const normalizeOrgName = (name) => (name || "").trim().toLowerCase();

export const ColorTeamsProvider = ({ children }) => {
  // Live, same pattern as missionDmEnabled/transformtoday/mainevent in
  // App.jsx — a separate listener on the same document is cheap and keeps
  // this provider self-contained rather than threading the flag down
  // through props across every screen that needs it.
  const [colorTeamsEnabled, setColorTeamsEnabled] = useState(false);
  const [teams, setTeams] = useState([]);
  const [teamsLoaded, setTeamsLoaded] = useState(false);

  useEffect(() => {
    const unsubscribe = onSnapshot(
      doc(db, "Permissions", "tempData"),
      (docSnapshot) => {
        setColorTeamsEnabled(!!docSnapshot.data()?.colorTeamsEnabled);
      },
      (error) => {
        console.error("Error listening for colorTeamsEnabled:", error);
      }
    );
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    // Fetched once, only once the feature is actually on — not on every
    // render, and not at all while the flag is off, per the brief. A toggle
    // from off -> on later in the same session re-fetches once; teamsLoaded
    // staying true afterward means it won't be fetched again if toggled off
    // and back on without the app restarting.
    if (!colorTeamsEnabled || teamsLoaded) return;
    let cancelled = false;

    const fetchTeams = async () => {
      try {
        const snapshot = await getDocs(collection(db, "colorTeams"));
        const fetched = snapshot.docs.map((docSnap) => {
          const data = docSnap.data();
          return {
            id: docSnap.id,
            color: data.color || colorsFallback,
            textColor: data.textColor || "white",
            orgs: Array.isArray(data.orgs) ? data.orgs : [],
            orgSet: new Set((data.orgs || []).map(normalizeOrgName)),
          };
        });
        if (!cancelled) {
          setTeams(fetched);
          setTeamsLoaded(true);
        }
      } catch (error) {
        console.error("Error fetching colorTeams:", error);
      }
    };

    fetchTeams();
    return () => {
      cancelled = true;
    };
  }, [colorTeamsEnabled, teamsLoaded]);

  const blueTeam = useMemo(
    () => teams.find((t) => t.id === "Blue") || null,
    [teams]
  );

  // A user with no org, or an org on none of the four lists, defaults to
  // Blue — stated explicitly in the brief.
  const getTeamForOrg = useMemo(
    () => (org) => {
      if (!teamsLoaded) return null;
      const normalized = normalizeOrgName(org);
      if (normalized) {
        const match = teams.find((t) => t.orgSet.has(normalized));
        if (match) return match;
      }
      return blueTeam;
    },
    [teams, teamsLoaded, blueTeam]
  );

  const value = useMemo(
    () => ({ colorTeamsEnabled, teamsLoaded, teams, getTeamForOrg }),
    [colorTeamsEnabled, teamsLoaded, teams, getTeamForOrg]
  );

  return (
    <ColorTeamsContext.Provider value={value}>
      {children}
    </ColorTeamsContext.Provider>
  );
};

const colorsFallback = "#6FA8DC"; // Blue, only used if a team doc is missing its color field

export const useColorTeams = () => useContext(ColorTeamsContext);
