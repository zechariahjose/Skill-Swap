import { APIProvider, Map } from '@vis.gl/react-google-maps';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../../src/context/ThemeContext';

const INITIAL_CENTER = { lat: 20, lng: 0 };
const apiKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY?.trim();

export default function GoogleMapCanvas() {
  const { colors } = useTheme();

  if (!apiKey) {
    return (
      <View style={[styles.unavailable, { backgroundColor: '#EEECE6' }]}>
        <Text style={[styles.title, { color: colors.ink }]}>Google Maps needs a web API key</Text>
        <Text style={[styles.description, { color: colors.muted }]}>
          Set EXPO_PUBLIC_GOOGLE_MAPS_WEB_API_KEY to a browser-restricted Maps JavaScript API key, then restart Expo.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <APIProvider apiKey={apiKey}>
        <Map
          defaultCenter={INITIAL_CENTER}
          defaultZoom={2}
          gestureHandling="greedy"
          style={styles.map}
          aria-label="Interactive Google map"
        />
      </APIProvider>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFill,
  },
  map: {
    width: '100%',
    height: '100%',
  },
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
