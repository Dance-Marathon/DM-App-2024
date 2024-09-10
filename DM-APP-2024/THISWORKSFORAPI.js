import React from 'react';
import { View, Button, Alert } from 'react-native';
import axios from 'axios';

import getAccessToken from './api/googleAuth';

const SPREADSHEET_ID = '1VTr6Jq_UbrJ1HEUTxCo0TlLvoLXc5PaPagufrzbAAxY';

// Function to update a cell in the spreadsheet
const updateCell = async (cellRange, value) => {
  const accessToken = await getAccessToken();

  const url = `https://sheets.googleapis.com/v4/spreadsheets/${SPREADSHEET_ID}/values/${cellRange}?valueInputOption=RAW`;

  const data = {
    values: [[value]],
  };

  const config = {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  };

  const response = await axios.put(url, data, config);

  if (response.status === 200) {
    Alert.alert('Success', `Cell ${cellRange} updated with value ${value}`);
  } else {
    Alert.alert('Error', `Failed to update the cell`);
  }
};

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Button
        title="Update Cell"
        onPress={() => updateCell('B3', 4)} // Update cell B3 with the value 4
      />
    </View>
  );
}
