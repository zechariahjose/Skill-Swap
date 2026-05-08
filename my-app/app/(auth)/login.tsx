import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { login } from '../../src/firebase/auth';
import { Colors } from '../../src/constants/Colors';
import { Theme } from '../../src/constants/Theme';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const onLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing fields', 'Enter email and password.');
      return;
    }
    try {
      setSubmitting(true);
      await login(email.trim(), password);
      router.replace('/(tabs)/home');
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
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />

      <View style={styles.inner}>
        {/* Brand */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandName}>Skill Swap</Text>
          <Text style={styles.brandTagline}>Trade what you know.</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholder="Email"
              placeholderTextColor={Colors.muted}
              style={styles.input}
            />
            <TextInput
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              placeholder="Password"
              placeholderTextColor={Colors.muted}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={onLogin}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/register" asChild>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.8}>
              <Text style={styles.linkText}>
                No account yet?{' '}
                <Text style={styles.linkAccent}>Join the community</Text>
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
    backgroundColor: Colors.background,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
  },
  brandBlock: {
    gap: 8,
    marginBottom: 40,
  },
  brandName: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 40,
    color: Colors.ink,
    letterSpacing: -0.5,
    lineHeight: 46,
  },
  brandTagline: {
    fontFamily: 'Nunito_400Regular',
    fontSize: 16,
    color: Colors.muted,
    fontStyle: 'italic',
  },
  formCard: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
    gap: 16,
  },
  inputGroup: {
    gap: 0,
  },
  input: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.body,
    color: Colors.body,
    paddingVertical: 14,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: 'transparent',
  },
  primaryBtn: {
    backgroundColor: Colors.ink,
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
    color: Colors.white,
    letterSpacing: 0.3,
  },
  linkBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  linkText: {
    fontFamily: 'Nunito_400Regular',
    fontSize: Theme.fontSize.small,
    color: Colors.muted,
  },
  linkAccent: {
    fontFamily: 'Nunito_700Bold',
    color: Colors.accent,
  },
});
