import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { useTheme } from '../src/context/ThemeContext';

export default function IndexScreen() {
  const { firebaseUser, isAdmin, loading } = useAuthContext();
  const { colors } = useTheme();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.cream }}>
        <ActivityIndicator size="large" color={colors.terracotta} />
      </View>
    );
  }

  if (!firebaseUser) return <Redirect href="/(auth)/login" />;
  if (isAdmin) return <Redirect href="/admin" />;
  return <Redirect href="/(tabs)/home" />;
}
