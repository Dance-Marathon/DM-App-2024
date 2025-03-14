import random
import requests
import firebase_admin
from firebase_admin import credentials, firestore

cred = credentials.Certificate("dm-app-2024-firebase-adminsdk-ld0j9-66a6c87a87.json")
firebase_admin.initialize_app(cred)
db = firestore.client()

def count_active_players():
    try:
        query = db.collection("MissionDMPlayers").where("isEliminated", "==", False)
        docs = query.stream()
        count = sum(1 for _ in docs)
        return count
    except Exception as e:
        print("Error fetching documents:", e)
        return 0

def eliminate_zero_elims_players():
    try:
        players_ref = db.collection("MissionDMPlayers")
        docs = list(players_ref.stream())
        x = 0
        remaining = count_active_players()

        for doc in docs:
            player_data = doc.to_dict()
            if player_data.get("roundElims") == 0 and player_data.get("isEliminated") == False :
                players_ref.document(doc.id).update({
                    "ranking": remaining - x,
                    "isEliminated": True
                })
                x += 1

        print("Eliminated those losers.")
    except Exception as e:
        print("Error eliminating players with 0 eliminations:", e)

def fetch_data():
    try:
        tokens = []
        query = db.collection("Users").where("inMissionDM", "==", True)
        docs = query.stream()
        for doc in docs:
            doc_data = doc.to_dict()
            token = doc_data.get("notificationToken")
            if token:
                tokens.append(token)
        return tokens
    except Exception as e:
        print("Error fetching events:", e)
        return []

def send_batch(batch):
    if not batch:
        print("Skipping empty batch.")
        return

    try:
        print(f"Sending batch of {len(batch)} notifications...")
        response = requests.post(
            "https://exp.host/--/api/v2/push/send",
            headers={
                "Accept": "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            json=batch
        )
        json_response = response.json()
        print("Expo response:", json_response)

        if "data" in json_response:
            for index, result in enumerate(json_response["data"]):
                if result.get("status") == "error":
                    print(f"Error sending to {batch[index].get('to')}: {result.get('message')}")
    except Exception as e:
        print("Error sending notifications:", e)

def send_push_notification_to_alive_players(notification):
    expo_push_tokens = fetch_data()
    print("Sending notifications...")

    batch_size = 50
    messages = []
    for token in expo_push_tokens:
        if not token or token.strip() == "":
            print("Skipping empty or invalid token:", token)
            continue

        messages.append({
            "to": token,
            "sound": "default",
            "title": notification.get("title"),
            "body": notification.get("message")
        })

        print(f"Added token: {token}")

        if len(messages) >= batch_size:
            send_batch(messages)
            messages = []

    if messages:
        send_batch(messages)

def reset_round_elims():
    try:
        players_ref = db.collection("MissionDMPlayers")
        docs = list(players_ref.stream())
        for doc in docs:
            players_ref.document(doc.id).update({"roundElims": 0})
        print("Reset round eliminations for all players.")
    except Exception as e:
        print("Error resetting round eliminations:", e)

def shuffle_targets():
    try:
        players_ref = db.collection("MissionDMPlayers")
        docs = list(players_ref.stream())
        if not docs:
            raise Exception("No players found.")

        players = []
        for doc in docs:
            data = doc.to_dict()
            players.append({
                "id": data.get("id"),
                "uid": doc.id,
                "name": data.get("name"),
                "isEliminated": data.get("isEliminated")
            })

        active_players = [player for player in players if not player.get("isEliminated")]
        if len(active_players) < 2:
            raise Exception("Not enough active players to shuffle.")

        shuffled_players = active_players[:]
        random.shuffle(shuffled_players)

        for i, current_player in enumerate(shuffled_players):
            new_target = shuffled_players[(i + 1) % len(shuffled_players)]
            players_ref.document(current_player["uid"]).update({
                "targetId": new_target.get("id")
            })
        print("Targets successfully shuffled.")
    except Exception as e:
        print("Error in shuffle_targets function:", e)
        raise Exception("Target shuffle failed.")

def round_over(round_id):
    if round_id is None:
        raise ValueError("roundId is required.")

    round_doc_id = "round" + str(round_id)
    
    game_stats_ref = db.collection("MissionDMGames").document("gameStats")

    try:
        # Get game doc
        game_doc = game_stats_ref.get()
        if not game_doc.exists:
            raise Exception("The Firebase document does not exist.")
        
        
        # Round 0 logic
        if round_id == 0:

            game_stats_ref.update({
                "currentRound": 1,
                "gameActive": True,
                "round0Eliminations": 0,
                "round1Eliminations": 0,
                "round2Eliminations": 0,
                "round3Eliminations": 0,
                "round4Eliminations": 0,
                "round5Eliminations": 0,
            })  

            shuffle_targets()
            return
        
        # Get round doc if not round 0
        round_doc_ref = db.collection("MissionDMGames").document(round_doc_id)

        round_doc = round_doc_ref.get()

        round_data = round_doc.to_dict()
        if round_data.get("roundOverLock") is True:
            raise Exception(f"Round {round_id} is already processed.")

        round_doc_ref.update({"roundOverLock": True})

        if count_active_players() > 1:
            eliminate_zero_elims_players()
        
        # Update game stats
        previous_players = game_doc.to_dict().get("playersRemaining")
        active_players = count_active_players()
        eliminations = previous_players - active_players
        field_to_update = f"round{round_id}Eliminations"

        # Process round
        reset_round_elims()
        send_push_notification_to_alive_players({
            "message": f"Round {round_id} is over. {eliminations} players were eliminated and {active_players} remain.",
            "title": f"MissionDM - Round {round_id} Over"
        }) 

        # If round 4, end game
        if round_id == 4:
            game_stats_ref.update({
                "currentRound": 5,
                "gameActive": False,
                "playersRemaining": active_players,
                field_to_update: eliminations,
            })
        else: # Update current round and eliminations
            game_stats_ref.update({
                "currentRound": round_id + 1,
                "playersRemaining": active_players,
                field_to_update: eliminations,
            })

        shuffle_targets()

        print(f"Round {round_id} processed successfully.")
    except Exception as e:
        print("Error processing round:", e)

if __name__ == "__main__":
    try:
        round_id = 1
        round_over(round_id)
    except Exception as err:
        print("Round processing failed:", err)
