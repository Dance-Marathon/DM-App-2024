import React, { useState, useEffect } from 'react';
import { Text, View, StyleSheet, Button, Linking } from 'react-native';
import { Camera } from 'expo-camera';

const Spirit = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [type, setType] = useState(Camera.Constants.Type.back);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = ({ type, data }) => {
    setScanned(true);
    if (data.startsWith('http://') || data.startsWith('https://')) {
      Linking.openURL(data).catch(err => console.error('An error occurred', err));
    } else {
      alert(`The scanned data is not a valid URL: ${data}`);
    }
  };

  if (hasPermission === null) {
    return <Text>Requesting for camera permission</Text>;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={styles.container}>
      <Camera
        style={styles.camera}
        type={type}
        onBarCodeScanned={scanned ? undefined : handleBarCodeScanned}>
      </Camera>
      <View style={styles.buttonContainer}>
          <Button
            title={scanned ? 'Tap to Scan Again' : 'Start Scanning'}
            onPress={() => setScanned(!scanned)}
          />
        </View>
    </View>
  );
}

export default Spirit;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    width: '75%', 
    height: '75%',
    marginTop: 40,
  },
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    marginTop: 10,
  },
});
