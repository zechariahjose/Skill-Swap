import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useAuthContext } from '../src/context/AuthContext';
import { Colors } from '../src/constants/Colors';

export default function IndexScreen() {
  const { firebaseUser, loading } = useAuthContext();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: Colors.cream,
        }}
      >
        <ActivityIndicator size="large" color={Colors.terracotta} />
      </View>
    );
  }

  if (!firebaseUser) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
