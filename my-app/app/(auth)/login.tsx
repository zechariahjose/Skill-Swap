import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { login } from '../../src/firebase/auth';
import { isAdminUser } from '../../src/firebase/firestore';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { colors, themeMode } = useTheme();

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }

    try {
      setSubmitting(true);
      const user = await login(email.trim(), password);
      const admin = await isAdminUser(user.uid);
      router.replace(admin ? '/admin' : '/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Login failed';
      Alert.alert('Unable to sign in', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <StatusBar barStyle={themeMode === 'dark' ? 'light-content' : 'dark-content'} />

      <View style={[styles.inner, { backgroundColor: colors.background }]}> 
        <View style={styles.brandBlock}>
          <Text style={[styles.brandName, { color: colors.ink }]}>Skill Swap</Text>
          <Text style={[styles.brandTagline, { color: colors.muted }]}>Trade what you know.</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.inputGroup}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.body, borderBottomColor: colors.border }]}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.body, borderBottomColor: colors.border }]}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled, { backgroundColor: colors.ink }]}
            onPress={onLogin}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: colors.white }]}> 
              {submitting ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.8}>
              <Text style={[styles.linkText, { color: colors.muted }]}>No account yet?{' '}
                <Text style={[styles.linkAccent, { color: colors.accent }]}>Join the community</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  brandBlock: {
    gap: 8,
    marginBottom: 40,
  },
  brandName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 40,
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  brandTagline: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    fontStyle: 'italic',
  },
  formCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 0,
  },
  input: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    backgroundColor: 'transparent',
  },
  primaryBtn: {
    borderRadius: Theme.borderRadius.full,
    paddingVertical: 16,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    opacity: 0.6,
  },
  primaryBtnText: {
    fontFamily: 'Nunito_700Bold',
    fontSize: Theme.fontSize.body,
    letterSpacing: 0.3,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
  },
  linkAccent: {
    fontFamily: 'Nunito_700Bold',
  },
});
