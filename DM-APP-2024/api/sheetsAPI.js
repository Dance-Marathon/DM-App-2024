import axios from "axios";
import { getAccessToken } from "./googleAuth";

const postRowToSheet = async (recipient, team, reason, date, time, giver) => {
    const ACCESS_TOKEN = await getAccessToken();
    const SPREADSHEET_ID = '1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY';
    console.log("Posting to sheet");

    try {
        const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/Sheet3:append?valueInputOption=RAW`;

        const rowData = [recipient, team, reason, date, time, giver, value];

        const postData = {
            values: [rowData],
        };

        const config = {
            headers: {
                Authorization: `Bearer ${ACCESS_TOKEN}`,
                'Content-Type': 'application/json',
            },
        };

        const response = await axios.post(url, postData, config);

        console.log('Row added successfully:', response.data);
        console.log('Response data:', JSON.stringify(response.data, null, 2));
        console.log('Response status:', response.status);
    } catch (error) {
        console.error('Error adding row to sheet:', error.response ? error.response.data : error.message);
    }
};

export default postRowToSheet;