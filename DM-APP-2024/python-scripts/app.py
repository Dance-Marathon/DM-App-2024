from flask import Flask, request, jsonify
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from gspread_dataframe import get_as_dataframe, set_with_dataframe
import pandas as pd
import os

app = Flask(__name__)

@app.route('/update-spirit-sheets', methods=['POST'])
def run_script():    
    # Run the Python script
    sheetsUpdate()

    return jsonify({'status': 'success'}), 200

def sheetsUpdate():
    # Define the scope
    scope = ["https://spreadsheets.google.com/feeds", "https://www.googleapis.com/auth/drive"]

    # Authenticate using the service account key file
    creds = ServiceAccountCredentials.from_json_keyfile_name(f'{os.getcwd()}\google-services.json', scope)
    client = gspread.authorize(creds)

    # Open the Google Sheets by name
    org_sheet = client.open("Spirit Point Tracker").worksheet("Sheet1")

    member_sheet = client.open("Spirit Point Tracker").worksheet("Sheet2")

    scan_sheet = client.open("Spirit Point Tracker").worksheet("Sheet3")

    # Load the data into a Pandas DataFrames
    org_df = get_as_dataframe(org_sheet)

    member_df = get_as_dataframe(member_sheet)

    scan_df = get_as_dataframe(scan_sheet)

    # Make empty dfs to collect new members and orgs
    new_members = pd.DataFrame(columns=['Name', 'Points'])

    new_orgs = pd.DataFrame(columns=['Team/Org', 'Points'])

    # Iterate through scan df
    for index in scan_df.index:
        # Get the name and org
        name = scan_df['Name'][index]
        org = scan_df['Team'][index]

        # If the name is not in the member_df or new_members, and is not undefined, add it
        if name not in member_df['Name'].values and name not in new_members['Name'].values and name != 'undefined':
            # Get row number
            row = len(member_df) + len(new_members) + 2

            # Add the name to the new members
            new_members = pd.concat([new_members, pd.DataFrame({'Name': [name], 'Points': [f'=COUNTIF(Sheet3!$A$2:$A$2000, A{row})']})])

        # If the org is not in the org_df or new_orgs, and is not undefined, add it
        if org not in org_df['Team/Org'].values and org not in new_orgs['Team/Org'].values and org != 'undefined':
            # Get row number
            row = len(org_df) + len(new_orgs) + 2

            # Add the org to the new orgs
            new_orgs = pd.concat([new_orgs, pd.DataFrame({'Team/Org': [org], 'Points': [f'=COUNTIF(Sheet3!$B$2:$B$2000, A{row})']})])

    # Update the Google Sheets
    set_with_dataframe(member_sheet, pd.concat([member_df, new_members]), include_index = False)
    set_with_dataframe(org_sheet, pd.concat([org_df, new_orgs]), include_index = False)


if __name__ == "__main__":
    app.run(debug=True)
