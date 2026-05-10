import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { register } from '../../src/firebase/auth';
import { useTheme } from '../../src/context/ThemeContext';
import { Theme } from '../../src/constants/Theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const { colors, themeMode } = useTheme();

  const onRegister = async () => {
    if (!name || !email || password.length < 6) {
      Alert.alert('Check details', 'Use a valid name, email, and password (6+ chars).');
      return;
    }
    try {
      setSubmitting(true);
      await register(email.trim(), password, name.trim());
      router.replace('/(tabs)/home');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Registration failed';
      Alert.alert('Unable to create account', message);
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
      <ScrollView
        contentContainerStyle={[styles.inner, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <Text style={[styles.brandName, { color: colors.ink }]}>Skill Swap</Text>
          <Text style={[styles.brandTagline, { color: colors.muted }]}>Share skills, not money.</Text>
        </View>

        <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}> 
          <View style={styles.inputGroup}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.body, borderBottomColor: colors.border }]}
            />
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
              placeholder="Password (6+ chars)"
              placeholderTextColor={colors.muted}
              style={[styles.input, { color: colors.body, borderBottomColor: colors.border }]}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled, { backgroundColor: colors.ink }]}
            onPress={onRegister}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={[styles.primaryBtnText, { color: colors.white }]}> 
              {submitting ? 'Creating account…' : 'Join the community'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.8}>
              <Text style={[styles.linkText, { color: colors.muted }]}>Already a member?{' '}
                <Text style={[styles.linkAccent, { color: colors.accent }]}>Sign in</Text>
              </Text>
            </TouchableOpacity>
          </Link>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingBottom: 64,
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
