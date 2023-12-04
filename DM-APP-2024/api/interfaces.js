const IExtraLifeUser = {
    avatarImageURL: '',
    createdDateUTC: '',
    displayName: '',
    links: {
        donate: '',
        page: '',
        stream: ''
    },
    eventID: 0,
    eventName: '',
    fundraisingGoal: 0,
    isTeamCaptain: false,
    numDonations: 0,
    participantID: 0,
    sumDonations: 0,
    sumPledges: 0,
    teamID: 0,
    teamName: '',
    teamURL: '',
    numMilestones: 0,
    numIncentives: 0,
    isCustomAvatarImage: false,
    URL: ''
};

const IExtraLifeMilestone = {
    fundraisingGoal: 0,
    description: '',
    links: {
        donate: ''
    },
    milestoneID: '',
    isActive: false,
    isComplete: false,
    endDateUTC: '',
    startDateUTC: ''
};

const IExtraLifeIncentive = {
    amount: 0,
    description: '',
    incentiveImageURL: '',
    quantity: 0,
    quantityClaimed: 0,
    links: {
        donate: ''
    },
    incentiveID: '',
    isActive: false,
    startDateUTC: '',
    endDateUTC: ''
};

const IExtraLifeBadge = {
    description: '',
    isUnlocked: false,
    title: '',
    unlockedDateUTC: '',
    badgeImageURL: '',
    badgeCode: ''
};

const IExtraLifeDonation = {
    participantID: 0,
    amount: 0,
    avatarImageURL: '',
    createdDateUTC: '',
    donationID: '',
    displayName: '',
    message: '',
    teamID: 0,
    donorID: '',
    eventID: 0,
    recipientName: '',
    links: {
        recipient: ''
    }
};

const IExtraLifeTeam = {
    fundraisingGoal: 0,
    eventName: '',
    avatarImageURL: '',
    createdDateUTC: '',
    eventID: 0,
    sumDonations: 0,
    teamID: 0,
    name: '',
    numDonations: 0,
    links: {
        stream: '',
        page: ''
    },
    members: [],
    isInviteOnly: false,
    captainDisplayName: '',
    numParticipants: 0,
    hasTeamOnlyDonations: false,
    streamIsLive: false,
    streamIsEnabled: false,
    streamingPlatform: '',
    sumPledges: 0,
    streamingChannel: '',
    isCustomAvatarImage: false
};

const IRosterList = {
    countMembers: 0,
    countPages: 0,
    members: []
};

const IBadgesList = {
    countBadges: 0,
    countPages: 0,
    badges: []
};

const IDonationsList = {
    countDonations: 0,
    countPages: 0,
    donations: []
};

const IIncentivesList = {
    countIncentives: 0,
    countPages: 0,
    incentives: []
};

const IMilestonesList = {
    countMilestones: 0,
    countPages: 0,
    milestones: []
};
