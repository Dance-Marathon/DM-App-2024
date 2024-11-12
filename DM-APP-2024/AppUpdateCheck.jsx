import VersionCheck from 'react-native-version-check';
import { Alert, Platform } from 'react-native';

const checkForUpdate = async () => {
  try {
    const latestVersion = await VersionCheck.getLatestVersion({
      country: 'us', // Specify country if necessary
    });

    const currentVersion = VersionCheck.getCurrentVersion();

    if (latestVersion !== currentVersion) {
      Alert.alert(
        'Update Available',
        'A new version of the app is available. Please update to continue.',
        [
          { text: 'Update', onPress: () => VersionCheck.needUpdate() }
        ]
      );
    }
  } catch (error) {
    console.error('Error checking version: ', error);
  }
};

export default checkForUpdate;
