const DOMAIN_STUB = 'https://events.dancemarathon.com/';

const pageOffset = (limit, page) => {
    if (page === 1) {
        return 1;
    }

    return limit * (page - 1);
};

export const apiPaths = {
    userDonationUrl: function (id, limit = 100, page = 1) {
        if (!limit) {
            return `${DOMAIN_STUB}api/participants/${id}/donations`;
        } else {
            return `${DOMAIN_STUB}api/participants/${id}/donations?limit=${limit}&offset=${pageOffset(limit, page)}`;
        }
    },

    profileUrl: function (id) {
        return `${DOMAIN_STUB}api/participants/${id}`;
    },

    userIncentivesUrl: function (id, limit = 100, page = 1) {
        if (!limit) {
            return `${DOMAIN_STUB}api/participants/${id}/incentives`;
        } else {
            return `${DOMAIN_STUB}api/participants/${id}/incentives?limit=${limit}&offset=${pageOffset(limit, page)}`;
        }
    },

    userBadgesUrl: function (id, limit = 100, page = 1) {
        if (!limit) {
            return `${DOMAIN_STUB}api/participants/${id}/badges`;
        } else {
            return `${DOMAIN_STUB}api/participants/${id}/badges?limit=${limit}&offset=${pageOffset(limit, page)}`;
        }
    },

    userMilestonesUrl: function (id, limit = 100, page = 1) {
        if (!limit) {
            return `${DOMAIN_STUB}api/participants/${id}/milestones`;
        } else {
            return `${DOMAIN_STUB}api/participants/${id}/milestones?limit=${limit}&offset=${pageOffset(limit, page)}`;
        }
    },

    teamDonationsUrl: function (id, limit = 100, page = 1) {
        if (!limit) {
            return `${DOMAIN_STUB}api/teams/${id}/donations`;
        } else {
            return `${DOMAIN_STUB}api/teams/${id}/donations?limit=${limit}&offset=${pageOffset(limit, page)}`;
        }
    },

    teamProfileUrl: function (id) {
        return `${DOMAIN_STUB}api/teams/${id}`;
    },

    teamRosterUrl: function (id, offset) {
        return `${DOMAIN_STUB}api/teams/${id}/participants${offset ? `?offset=${offset + 1}` : ''}`;
    },
};

