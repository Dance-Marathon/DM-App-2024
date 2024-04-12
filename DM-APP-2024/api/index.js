

import { apiPaths } from './api-paths'
import { IBadgesList, IDonationsList, IExtraLifeTeam, IExtraLifeUser, IIncentivesList, IMilestonesList, IRosterList } from './interfaces';

export { IDonationsList, IExtraLifeTeam, IExtraLifeUser, IRosterList } from './interfaces';

export const getUserInfo = async (id) => {
    return new Promise((resolve, reject) => {
        const url = apiPaths.profileUrl(Number(id));
        let userInfoJson = {};

        fetch(url)
            .then(async (res) => {
                try {
                    userInfoJson = await res.json();
                    userInfoJson.avatarImageURL = userInfoJson.avatarImageURL;
                    userInfoJson.donateURL = `https://events.dancemarathon.com/index.cfm?fuseaction=donordrive.participant&participantID=${id}`;

                    if (userInfoJson.teamID) {
                        getTeamInfo(userInfoJson.teamID, false)
                            .then((data) => {
                                userInfoJson.teamURL = data.teamURL;
                                console.log('User Info:', userInfoJson);
                                resolve(userInfoJson);
                            }).catch((reason) => {
                                reject(reason);
                            });
                    } else {
                        console.error('Team Info Fetch Error:', reason);
                        resolve(userInfoJson);
                    }
                } catch (e) {
                    console.log('User Info:', userInfoJson);
                    reject(e);
                }
            })
            .catch(() => {
                console.error('Fetch Error:', error);
                reject('There was an error trying to make your request');
            });
    });
}

export const getUserDonations = async (id, limit = 100, page = 1) => {
    return new Promise((resolve, reject) => {
        const url = apiPaths.userDonationUrl(id, limit, page);
        const userDonationsJson = {};

        fetch(url)
            .then(async (res) => {
                try {
                    userDonationsJson.countDonations = parseInt(res.headers.get('num-records'), 10) || 0;
                    userDonationsJson.countPages = Math.ceil(userDonationsJson.countDonations / limit);
                    userDonationsJson.donations = await res.json();
                    resolve(userDonationsJson);
                    console.log('Donations:', userDonationsJson);
                } catch (e) {
                    reject(e);
                }
            })
            .catch(() => {
                console.log('Error parsing userDonations URL');
                reject('There was an error trying to make your request');
            });
    });
}

export const getUserMilestones = async (id, limit = 100, page = 1) => {
  return new Promise((resolve, reject) => {
    const url = apiPaths.userMilestonesUrl(id, limit, page);
    const userMilestonesJson = {};

    fetch(url)
      .then(async (res) => {
        try {
          userMilestonesJson.countMilestones = parseInt(res.headers.get('num-records'), 10) || 0;
          userMilestonesJson.countPages = Math.ceil(userMilestonesJson.countMilestones / limit);
          userMilestonesJson.milestones = await res.json();
          resolve(userMilestonesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log('Error parsing userMilestones URL');
        reject('There was an error trying to make your request');
      });
  });
};

export const getUserIncentives = async (id, limit = 100, page = 1) => {
  return new Promise((resolve, reject) => {
    const url = apiPaths.userIncentivesUrl(id, limit, page);
    const userIncentivesJson = {};

    fetch(url)
      .then(async (res) => {
        try {
          userIncentivesJson.countIncentives = parseInt(res.headers.get('num-records'), 10) || 0;
          userIncentivesJson.countPages = Math.ceil(userIncentivesJson.countIncentives / limit);
          userIncentivesJson.incentives = await res.json();
          resolve(userIncentivesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log('Error parsing userIncentives URL');
        reject('There was an error trying to make your request');
      });
  });
};

export const getUserBadges = async (id, limit = 100, page = 1) => {
  return new Promise((resolve, reject) => {
    const url = apiPaths.userBadgesUrl(id, limit, page);
    const userBadgesJson = {};

    fetch(url)
      .then(async (res) => {
        try {
          userBadgesJson.countBadges = parseInt(res.headers.get('num-records'), 10) || 0;
          userBadgesJson.countPages = Math.ceil(userBadgesJson.countBadges / limit);
          userBadgesJson.badges = await res.json();
          resolve(userBadgesJson);
        } catch (e) {
          reject(e);
        }
      })
      .catch(() => {
        console.log('Error parsing userBadges URL');
        reject('There was an error trying to make your request');
      });
  });
};

export const getTeamInfo = async (id, fetchRoster = true) => {
  return new Promise((resolve, reject) => {
    const url = apiPaths.teamProfileUrl(id);
    let teamInfoJson = {};

    fetch(url)
      .then(async (res) => {
        try {
          teamInfoJson = await res.json();
        } catch (e) {
          reject(e);
        }
        teamInfoJson.avatarImageURL = 'http:' + teamInfoJson.avatarImageURL;
        if (fetchRoster) {
          getTeamRoster(id)
            .then((rosterData) => {
              teamInfoJson.members = rosterData.members.map((u) => {
                u.URL = `https://events.dancemarathon.com/index.cfm?fuseaction=donordrive.team&teamID=${u.participantID}`;
                return u;
              });

              resolve(teamInfoJson);
            }).catch((reason) => {
              reject(reason);
            });
        } else {
          resolve(teamInfoJson);
        }
      })
      .catch(() => {
        console.log('Error obtaining team info');
        reject('There was an error trying to make your request');
      });
  });
};

export const getTeamDonations = async (id, limit = 100, page = 1) => {
  return new Promise((resolve, reject) => {
    const teamDonationsJson = {};
    const url = apiPaths.teamDonationsUrl(id, limit, page);

    fetch(url)
      .then(async (res) => {
        try {
          teamDonationsJson.countDonations = parseInt(res.headers.get('num-records'), 10) || 0;
          teamDonationsJson.countPages = Math.ceil(teamDonationsJson.countDonations / limit);
          teamDonationsJson.donations = await res.json();
        } catch (e) {
          reject(e);
        }

        resolve(teamDonationsJson);
      })
      .catch(() => {
        console.log('Error parsing teamDonations URL');
        reject('There was an error trying to make your request');
      });
  });
};

export const getTeamRoster = async (id, page) => {
  return new Promise((resolve, reject) => {
    const teamRosterJson = {};
    const offsetCalc = (page && page !== 1) ? ((page - 1) * 100) : null;
    const url = apiPaths.teamRosterUrl(id, offsetCalc);

    fetch(url)
      .then(async (res) => {
        try {
          teamRosterJson.countMembers = parseInt(res.headers.get('num-records'), 10) || 0;
          teamRosterJson.countPages = Math.ceil(teamRosterJson.countMembers / 100);
          try {
            teamRosterJson.members = await res.json();
          } catch (e) {
            teamRosterJson.members = [];
          }
        } catch (e) {
          reject(e);
        }

        if (!teamRosterJson.members) {
          teamRosterJson.members = [];
        }

        teamRosterJson.members.forEach((member) => {
          member.avatarImageURL = 'https:' + member.avatarImageURL;
        });

        resolve(teamRosterJson);
      })
      .catch(() => {
        console.log('Error parsing teamRoster URL');
        reject('There was an error trying to make your request');
      });
  });
};

//module.exports = { getUserInfo, getUserDonations, getUserMilestones, getUserIncentives, getUserBadges, getTeamInfo, getTeamDonations, getTeamRoster };
