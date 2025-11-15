import React, { createContext, useState, useEffect } from "react";
import {
  getUserInfo,
  getUserMilestones,
  getUserDonations,
  getUserBadges,
} from "./index";
import { getUserData } from "../Firebase/UserManager";

export const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userID, setUserID] = useState(null);
  const [role, setRole] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const [milestoneInfo, setMilestoneInfo] = useState(null);
  const [donationInfo, setDonationInfo] = useState(null);
  const [badgeInfo, setBadgeInfo] = useState(null);
  const [isLoadingUserInfo, setIsLoadingUserInfo] = useState(true);
  const [isLoadingMilestones, setIsLoadingMilestones] = useState(true);
  const [isLoadingDonations, setIsLoadingDonations] = useState(true);

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
  const refetchUserData = async () => {
    setIsLoadingUserInfo(true);
    setIsLoadingMilestones(true);
    setIsLoadingDonations(true);

    try {
      const userData = await getUserData();
      // console.log("userData: ", JSON.stringify(userData));
      setUserID(userData.donorID);
      setRole(userData.role);

      const [userInfoData, milestonesData, donationsData, badgesData] =
        await Promise.all([
          getUserInfo(userData.donorID),
          getUserMilestones(userData.donorID),
          getUserDonations(userData.donorID),
          getUserBadges(userData.donorID),
        ]);

      setUserInfo(userInfoData);
      setMilestoneInfo(milestonesData);
      setDonationInfo(donationsData);
      setBadgeInfo(badgesData);
    } catch (err) {
      console.error("Error fetching user data:", err);
    } finally {
      setIsLoadingUserInfo(false);
      setIsLoadingMilestones(false);
      setIsLoadingDonations(false);
    }
  };

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
        userInfo,
        milestoneInfo,
        donationInfo,
        badgeInfo,
        isLoadingUserInfo,
        isLoadingMilestones,
        isLoadingDonations,
        refetchUserData,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};
