import { useState } from 'react';
import { Alert, ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useIdTokenAuthRequest } from 'expo-auth-session/providers/google';
import * as WebBrowser from 'expo-web-browser';
import type { User as FirebaseUser } from 'firebase/auth';
import { useTheme } from '../../src/context/ThemeContext';
import { signInWithGoogle } from '../../src/firebase/auth';

WebBrowser.maybeCompleteAuthSession();

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
const iosClientId = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
const androidClientId = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
const missingClientId = 'google-oauth-client-id-not-configured';

export default function GoogleSignInButton({
  disabled = false,
  onSignedIn,
}: {
  disabled?: boolean;
  onSignedIn: (user: FirebaseUser) => void | Promise<void>;
}) {
  const { colors } = useTheme();
  const [submitting, setSubmitting] = useState(false);
  const [request, , promptAsync] = useIdTokenAuthRequest({
    webClientId: webClientId || missingClientId,
    iosClientId: iosClientId || missingClientId,
    androidClientId: androidClientId || missingClientId,
    selectAccount: true,
  });

  const platformClientId = Platform.select({
    ios: iosClientId,
    android: androidClientId,
    default: webClientId,
  });
  const isConfigured = Boolean(platformClientId);

  const onPress = async () => {
    if (!request || !isConfigured || submitting || disabled) return;

    try {
      setSubmitting(true);
      const result = await promptAsync();
      if (result.type === 'cancel' || result.type === 'dismiss') return;
      if (result.type === 'error') {
        throw new Error(result.error?.message ?? 'Google sign-in did not complete.');
      }
      if (result.type !== 'success') return;

      const idToken = result.params.id_token;
      if (!idToken) {
        throw new Error('Google did not return an ID token. Check your OAuth client configuration.');
      }

      const user = await signInWithGoogle(idToken);
      await onSignedIn(user);
    } catch (error) {
      Alert.alert(
        'Google sign-in failed',
        error instanceof Error ? error.message : 'Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.dividerRow}>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.dividerText, { color: colors.muted }]}>OR CONTINUE WITH</Text>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
      </View>
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="Continue with Google"
        style={[
          styles.button,
          { backgroundColor: colors.surface, borderColor: colors.border },
          (disabled || submitting || !request || !isConfigured) && styles.disabled,
        ]}
        onPress={onPress}
        disabled={disabled || submitting || !request || !isConfigured}
        activeOpacity={0.8}
      >
        {submitting ? (
          <ActivityIndicator size="small" color={colors.ink} />
        ) : (
          <Ionicons name="logo-google" size={18} color="#4285F4" />
        )}
        <Text style={[styles.buttonText, { color: colors.ink }]}>
          {submitting ? 'Connecting to Google…' : 'Continue with Google'}
        </Text>
      </TouchableOpacity>
      {!isConfigured && (
        <Text style={[styles.helpText, { color: colors.muted }]}>
          Add the Google OAuth client ID for this platform to your environment settings.
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 12 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  divider: { flex: 1, height: 1 },
  dividerText: { fontFamily: 'Nunito_700Bold', fontSize: 9, letterSpacing: 1.1 },
  button: {
    minHeight: 50,
    borderRadius: 999,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 16,
  },
  buttonText: { fontFamily: 'Nunito_700Bold', fontSize: 14 },
  disabled: { opacity: 0.55 },
  helpText: { fontFamily: 'Nunito_400Regular', fontSize: 11, lineHeight: 16, textAlign: 'center' },
});
