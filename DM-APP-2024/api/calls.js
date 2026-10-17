import React, { createContext, useState, useEffect, useCallback } from "react";
import {
  getUserInfo,
  getUserMilestones,
  getUserDonations,
  getUserBadges,
  getDonorDriveStaleCount,
} from "./index";
import { doc, updateDoc } from "firebase/firestore";
import { getUserData } from "../Firebase/UserManager";
import { auth, db } from "../Firebase/AuthManager";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userID, setUserID] = useState(null);
  const [role, setRole] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [captainTeam, setCaptainTeam] = useState("");
  // From the user's Firestore doc (not DonorDrive), so they're available even
  // when DonorDrive can't be reached.
  const [organization, setOrganization] = useState("");
  const [donorLink, setDonorLink] = useState("");
  const [userInfo, setUserInfo] = useState(null);
  const [milestoneInfo, setMilestoneInfo] = useState(null);
  const [donationInfo, setDonationInfo] = useState(null);
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);
  // True when the last load showed numbers saved from an earlier update
  // (DonorDrive couldn't be reached) rather than current ones.
  const [dataIsStale, setDataIsStale] = useState(false);

  // Fetch user data and basic info
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const userData = await getUserData();
  //       //console.log("userData", userData);
  //       setUserID(userData.donorID);
  //       setRole(userData.role);

  //       const userInfoData = await getUserInfo(userData.donorID);
  //       //console.log("userInfoData", userInfoData);
  //       setUserInfo(userInfoData);
  //     } catch (err) {
  //       console.error("Error fetching user info:", err);
  //     } finally {
  //       setIsLoadingUserInfo(false);
  //     }
  //   };

  //   fetchUserData();
  // }, []);
  // 1. Create the function to fetch basic user data
  // const refetchUserData = async () => {
  //   setIsLoadingUserInfo(true);
  //   // Reset ID and Role in case the link fetch fails or returns null
  //   setUserID(null);
  //   setRole(null);
  //   setUserInfo(null);

  //   try {
  //     const userData = await getUserData();
  //     //console.log("userData", userData);
  //     setUserID(userData.donorID); // This will trigger all dependent useEffects!
  //     setRole(userData.role);

  //     const userInfoData = await getUserInfo(userData.donorID);
  //     //console.log("userInfoData", userInfoData);
  //     setUserInfo(userInfoData);
  //   } catch (err) {
  //     console.error("Error fetching user info:", err);
  //   } finally {
  //     setIsLoadingUserInfo(false);
  //   }
  // };
  const refetchUserData = useCallback(async (options = {}) => {
    setIsLoadingUserInfo(true);
    setIsLoadingMilestones(true);
    setIsLoadingDonations(true);

    try {
      const userData = await getUserData(options);
      if (!userData) {
        setUserID(null);
        setRole(null);
        setUserInfo(null);
        setMilestoneInfo(null);
        setDonationInfo(null);
        setBadgeInfo(null);
        return;
      }
      console.log("userData: ", JSON.stringify(userData));
      setUserID(userData.donorID);
      setRole(userData.role);
      setIsAdmin(userData.isAdmin === true);
      setCaptainTeam(userData.captainTeam || "");
      setOrganization(userData.organization || "");
      setDonorLink(userData.donorLink || "");

      const staleBefore = getDonorDriveStaleCount();
      const [userInfoData, milestonesData, donationsData, badgesData] =
        await Promise.all([
          getUserInfo(userData.donorID),
          getUserMilestones(userData.donorID),
          getUserDonations(userData.donorID),
          getUserBadges(userData.donorID),
        ]);

      const gotFreshData = getDonorDriveStaleCount() === staleBefore;
      setDataIsStale(!gotFreshData);
      setUserInfo(userInfoData);
      setMilestoneInfo(milestonesData);
      setDonationInfo(donationsData);
      setBadgeInfo(badgesData);

      // Denormalize onto this user's own Firestore doc — the Team and
      // Organization tabs read sumDonations/displayName/organization from
      // here instead of calling DonorDrive live for every member on every
      // page view, which is what kept tripping DonorDrive's rate limit for
      // everyone at once. Every Personal tab visit now keeps this in sync.
      // Skipped when this was stale/saved data rather than a genuinely fresh
      // DonorDrive response, so a rate-limited load can't overwrite good
      // data with a stale copy of itself.
      if (gotFreshData && auth.currentUser) {
        updateDoc(doc(db, "Users", auth.currentUser.uid), {
          sumDonations: userInfoData.sumDonations || 0,
          ...(userInfoData.teamName
            ? { organization: userInfoData.teamName }
            : {}),
          ...(userInfoData.displayName
            ? { displayName: userInfoData.displayName }
            : {}),
        }).catch((err) =>
          console.error("Error syncing DonorDrive totals to Firestore:", err)
        );
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoadingUserInfo(false);
      setIsLoadingMilestones(false);
      setIsLoadingDonations(false);
    }
  }, []);

  // 2. Replace the initial useEffect with a call to the new function
  useEffect(() => {
    refetchUserData();
  }, []);

  // Fetch user milestones
  useEffect(() => {
    if (userID) {
      getUserMilestones(userID)
        .then((milestonesData) => {
          setMilestoneInfo(milestonesData);
          //console.log("Fetched Milestones:", milestonesData);
        })
        .catch((err) => {
          console.error("Error fetching milestones:", err);
        })
        .finally(() => {
          setIsLoadingMilestones(false);
        });
    }
  }, [userID]);

  // Fetch user donations
  useEffect(() => {
    if (userID) {
      getUserDonations(userID)
        .then((donationsData) => {
          setDonationInfo(donationsData);
          // console.log("Fetched Donations:", donationsData);
        })
        .catch((err) => {
          console.error("Error fetching donations:", err);
        })
        .finally(() => {
          setIsLoadingDonations(false);
        });
    }
  }, [userID]);

  // Fetch user badges
  useEffect(() => {
    if (userID) {
      getUserBadges(userID)
        .then((data) => {
          setBadgeInfo(data);
          //console.log("Fetched Badges:", data);
        })
        .catch((err) => {
          console.error("Error fetching badges:", err);
        });
    }
  }, [userID]);

  return (
    <UserContext.Provider
      value={{
        userID,
        role,
        isAdmin,
        captainTeam,
        organization,
        donorLink,
        userInfo,
        milestoneInfo,
        donationInfo,
        badgeInfo,
        isLoadingUserInfo,
        isLoadingMilestones,
        isLoadingDonations,
        dataIsStale,
        refetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
