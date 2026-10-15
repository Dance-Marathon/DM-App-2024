import React from "react";
import TeamFundraiserView from "./TeamFundraiserView";

const TeamFundraiser = ({ route }) => {
  const { teamId } = route.params || {};

  return <TeamFundraiserView teamId={teamId} />;
};

export default TeamFundraiser;
