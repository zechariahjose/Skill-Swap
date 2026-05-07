import { Link, router } from 'expo-router';
import { useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  StatusBar,
} from 'react-native';
import { register } from '../firebase/auth';
import { Colors } from '../constants/Colors';
import { Theme } from '../constants/Theme';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
      style={styles.container}
    >
      <StatusBar barStyle="dark-content" />
      <ScrollView
        contentContainerStyle={styles.inner}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Brand */}
        <View style={styles.brandBlock}>
          <Text style={styles.brandName}>Skill Swap</Text>
          <Text style={styles.brandTagline}>Share skills, not money.</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <View style={styles.inputGroup}>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={Colors.muted}
              style={styles.input}
            />
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
              placeholder="Password (6+ chars)"
              placeholderTextColor={Colors.muted}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            style={[styles.primaryBtn, submitting && styles.primaryBtnDisabled]}
            onPress={onRegister}
            disabled={submitting}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>
              {submitting ? 'Creating account…' : 'Join the community'}
            </Text>
          </TouchableOpacity>

          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.linkBtn} activeOpacity={0.8}>
              <Text style={styles.linkText}>
                Already a member?{' '}
                <Text style={styles.linkAccent}>Sign in</Text>
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
    backgroundColor: Colors.background,
  },
  inner: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 72,
    paddingBottom: 64,
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
