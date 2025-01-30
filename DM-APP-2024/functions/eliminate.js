const {onCall} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");

const db = admin.firestore();

exports.eliminate = onCall(async (data, context) => {
  const {eliminatorId, code, gameId} = data;

  if (!eliminatorId || !code || !gameId) {
    throw new Error("Missing required fields.");
  }

  try {
    const eliminatedSnapshot = await db
        .collection("MissionDMPlayers")
        .where("gameId", "==", gameId)
        .where("code", "==", code)
        .get();

    if (eliminatedSnapshot.empty) {
      throw new Error("Invalid code.");
    }

    const eliminatedDoc = eliminatedSnapshot.docs[0];
    const eliminatedId = eliminatedDoc.id;

    await db.collection("MissionDMPlayers").doc(eliminatedId).update({
      isAlive: false,
    });

    return {message: "Elimination verified and target reassigned."};
  } catch (error) {
    console.error("Error in eliminate function:", error);
    throw new Error("Elimination failed.");
  }
});
