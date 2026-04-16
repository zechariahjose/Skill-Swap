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
      <View style={styles.card}>
        <Text style={styles.title}>Create your profile</Text>
        <Text style={styles.subtitle}>Start exchanging skills with your community</Text>

        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="Full name"
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
          placeholder="Password"
          placeholderTextColor={Colors.muted}
          style={styles.input}
        />

        <TouchableOpacity style={styles.button} onPress={onRegister} disabled={submitting}>
          <Text style={styles.buttonText}>{submitting ? 'Creating account...' : 'Create account'}</Text>
        </TouchableOpacity>

        <Link href="/(auth)/login" asChild>
          <TouchableOpacity style={styles.linkButton}>
            <Text style={styles.linkText}>Already have an account? Sign in</Text>
          </TouchableOpacity>
        </Link>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.cream,
    justifyContent: 'center',
    padding: Theme.spacing.lg,
  },
  card: {
    backgroundColor: Colors.white,
    borderRadius: Theme.borderRadius.lg,
    padding: Theme.spacing.lg,
    gap: Theme.spacing.sm,
    ...Theme.shadow.card,
  },
  title: {
    fontFamily: 'DMSerifDisplay_400Regular',
    fontSize: 30,
    color: Colors.charcoal,
  },
  subtitle: {
    fontFamily: 'Nunito_400Regular',
    color: Colors.muted,
    marginBottom: Theme.spacing.md,
  },
  input: {
    backgroundColor: Colors.cream,
    borderRadius: Theme.borderRadius.md,
    borderWidth: 1,
    borderColor: Colors.sandDark,
    paddingHorizontal: Theme.spacing.md,
    paddingVertical: 12,
    fontFamily: 'Nunito_400Regular',
    color: Colors.charcoal,
  },
  button: {
    marginTop: Theme.spacing.sm,
    borderRadius: Theme.borderRadius.full,
    backgroundColor: Colors.terracotta,
    alignItems: 'center',
    paddingVertical: 12,
  },
  buttonText: {
    color: Colors.white,
    fontFamily: 'Nunito_700Bold',
  },
  linkButton: {
    alignItems: 'center',
    paddingVertical: Theme.spacing.sm,
  },
  linkText: {
    fontFamily: 'Nunito_600SemiBold',
    color: Colors.terracotta,
  },
});
