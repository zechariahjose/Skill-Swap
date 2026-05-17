import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { DMSerifDisplay_400Regular } from '@expo-google-fonts/dm-serif-display';
import {
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
} from '@expo-google-fonts/nunito';
import { ActivityIndicator, View } from 'react-native';
import { AuthProvider } from '../src/context/AuthContext';
import { ThemeProvider } from '../src/context/ThemeContext';

export default function RootLayout() {
  const [loaded] = useFonts({
    DMSerifDisplay_400Regular,
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
  });

  if (!loaded) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#F2F0EC',
        }}
      >
        <ActivityIndicator size="large" color="#4A4641" />
      </View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="user-profile" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="admin" />
        </Stack>
      </AuthProvider>
    </ThemeProvider>
  );
}
