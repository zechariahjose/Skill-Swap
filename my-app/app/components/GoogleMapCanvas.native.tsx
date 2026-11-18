import Constants from 'expo-constants';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { Platform, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';

const INITIAL_REGION = {
  latitude: 20,
  longitude: 0,
  latitudeDelta: 70,
  longitudeDelta: 70,
};

export default function GoogleMapCanvas() {
  const { colors } = useTheme();
  const platform = Platform.OS === 'ios' ? 'ios' : 'android';
  const mapsConfigured =
    Constants.expoConfig?.extra?.googleMapsConfigured?.[platform] === true;

  if (!mapsConfigured) {
    return (
      <View style={[styles.unavailable, { backgroundColor: '#EEECE6' }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Google Maps needs a platform API key</Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          Configure GOOGLE_MAPS_ANDROID_API_KEY or GOOGLE_MAPS_IOS_API_KEY and rebuild the native app.
        </Text>
      </View>
    );
  }

  return (
    <MapView
      style={StyleSheet.absoluteFill}
      provider={PROVIDER_GOOGLE}
      initialRegion={INITIAL_REGION}
      showsCompass
      showsScale
      toolbarEnabled
      accessibilityLabel="Interactive Google map"
    />
  );
}

const styles = StyleSheet.create({
  unavailable: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 36,
  },
  title: {
    fontFamily: 'Nunito_700Bold',
    fontSize: 17,
    textAlign: 'center',
  },
  description: {
    marginTop: 8,
    fontFamily: 'Nunito_400Regular',
    fontSize: 13,
    lineHeight: 19,
    textAlign: 'center',
  },
});
